package chat

import (
	"context"
	"sync"
	"time"
)

type admissionItem struct {
	sessionID string
	enqueued  time.Time
	resultCh  chan bool
}

type AdmissionQueue struct {
	lease   *LeaseManager
	clock   Clock
	retry   time.Duration
	maxWait time.Duration

	mu    sync.Mutex
	queue []*admissionItem

	wakeCh chan struct{}
}

func NewAdmissionQueue(lease *LeaseManager, clock Clock, retry, maxWait time.Duration) *AdmissionQueue {
	q := &AdmissionQueue{
		lease:   lease,
		clock:   clock,
		retry:   retry,
		maxWait: maxWait,
		wakeCh:  make(chan struct{}, 1),
	}
	go q.loop()
	return q
}

func (q *AdmissionQueue) Enqueue(sessionID string) (position int, result <-chan bool) {
	item := &admissionItem{
		sessionID: sessionID,
		enqueued:  q.clock.Now(),
		resultCh:  make(chan bool, 1),
	}
	q.mu.Lock()
	q.queue = append(q.queue, item)
	position = len(q.queue)
	q.mu.Unlock()
	q.signalWake()
	return position, item.resultCh
}

func (q *AdmissionQueue) Remove(sessionID string) {
	q.mu.Lock()
	defer q.mu.Unlock()
	for i := range q.queue {
		if q.queue[i].sessionID == sessionID {
			q.queue = append(q.queue[:i], q.queue[i+1:]...)
			return
		}
	}
}

func (q *AdmissionQueue) signalWake() {
	select {
	case q.wakeCh <- struct{}{}:
	default:
	}
}

func (q *AdmissionQueue) loop() {
	t := time.NewTicker(q.retry)
	defer t.Stop()

	for {
		select {
		case <-t.C:
		case <-q.wakeCh:
		}

		for {
			item := q.peek()
			if item == nil {
				break
			}

			now := q.clock.Now()
			if now.Sub(item.enqueued) > q.maxWait {
				q.popIfHead(item.sessionID)
				item.resultCh <- false
				close(item.resultCh)
				continue
			}

			ok, err := q.lease.Acquire(context.Background(), item.sessionID, now)
			if err != nil || !ok {
				break
			}

			q.popIfHead(item.sessionID)
			item.resultCh <- true
			close(item.resultCh)
		}
	}
}

func (q *AdmissionQueue) peek() *admissionItem {
	q.mu.Lock()
	defer q.mu.Unlock()
	if len(q.queue) == 0 {
		return nil
	}
	return q.queue[0]
}

func (q *AdmissionQueue) popIfHead(sessionID string) {
	q.mu.Lock()
	defer q.mu.Unlock()
	if len(q.queue) == 0 {
		return
	}
	if q.queue[0].sessionID != sessionID {
		return
	}
	q.queue = q.queue[1:]
}
