package engine

// Red-black tree implementation specialized for int64 keys.
// This is used by the in-memory matching engine order book.

type rbColor bool

const (
	rbRed   rbColor = true
	rbBlack rbColor = false
)

type rbNode struct {
	key    int64
	value  *priceLevel
	color  rbColor
	left   *rbNode
	right  *rbNode
	parent *rbNode
}

type rbTree struct {
	root *rbNode
	nil  *rbNode
}

func newRBTree() *rbTree {
	nilNode := &rbNode{color: rbBlack}
	nilNode.left = nilNode
	nilNode.right = nilNode
	nilNode.parent = nilNode

	return &rbTree{
		root: nilNode,
		nil:  nilNode,
	}
}

func (t *rbTree) isEmpty() bool {
	return t.root == t.nil
}

func (t *rbTree) get(key int64) *rbNode {
	x := t.root
	for x != t.nil {
		if key < x.key {
			x = x.left
		} else if key > x.key {
			x = x.right
		} else {
			return x
		}
	}
	return nil
}

func (t *rbTree) min() *rbNode {
	if t.root == t.nil {
		return nil
	}
	return t.minimum(t.root)
}

func (t *rbTree) max() *rbNode {
	if t.root == t.nil {
		return nil
	}
	return t.maximum(t.root)
}

func (t *rbTree) minimum(x *rbNode) *rbNode {
	for x.left != t.nil {
		x = x.left
	}
	return x
}

func (t *rbTree) maximum(x *rbNode) *rbNode {
	for x.right != t.nil {
		x = x.right
	}
	return x
}

func (t *rbTree) successor(x *rbNode) *rbNode {
	if x.right != t.nil {
		return t.minimum(x.right)
	}
	y := x.parent
	for y != t.nil && x == y.right {
		x = y
		y = y.parent
	}
	if y == t.nil {
		return nil
	}
	return y
}

func (t *rbTree) predecessor(x *rbNode) *rbNode {
	if x.left != t.nil {
		return t.maximum(x.left)
	}
	y := x.parent
	for y != t.nil && x == y.left {
		x = y
		y = y.parent
	}
	if y == t.nil {
		return nil
	}
	return y
}

func (t *rbTree) getOrInsert(key int64, createValue func() *priceLevel) *rbNode {
	// Standard BST insert; if found, return existing.
	y := t.nil
	x := t.root
	for x != t.nil {
		y = x
		if key < x.key {
			x = x.left
		} else if key > x.key {
			x = x.right
		} else {
			return x
		}
	}

	z := &rbNode{
		key:    key,
		value:  createValue(),
		color:  rbRed,
		left:   t.nil,
		right:  t.nil,
		parent: y,
	}

	if y == t.nil {
		t.root = z
	} else if z.key < y.key {
		y.left = z
	} else {
		y.right = z
	}

	t.insertFixup(z)
	return z
}

func (t *rbTree) insertFixup(z *rbNode) {
	for z.parent.color == rbRed {
		if z.parent == z.parent.parent.left {
			y := z.parent.parent.right
			if y.color == rbRed {
				z.parent.color = rbBlack
				y.color = rbBlack
				z.parent.parent.color = rbRed
				z = z.parent.parent
			} else {
				if z == z.parent.right {
					z = z.parent
					t.leftRotate(z)
				}
				z.parent.color = rbBlack
				z.parent.parent.color = rbRed
				t.rightRotate(z.parent.parent)
			}
		} else {
			y := z.parent.parent.left
			if y.color == rbRed {
				z.parent.color = rbBlack
				y.color = rbBlack
				z.parent.parent.color = rbRed
				z = z.parent.parent
			} else {
				if z == z.parent.left {
					z = z.parent
					t.rightRotate(z)
				}
				z.parent.color = rbBlack
				z.parent.parent.color = rbRed
				t.leftRotate(z.parent.parent)
			}
		}
	}
	t.root.color = rbBlack
}

func (t *rbTree) leftRotate(x *rbNode) {
	y := x.right
	x.right = y.left
	if y.left != t.nil {
		y.left.parent = x
	}
	y.parent = x.parent
	if x.parent == t.nil {
		t.root = y
	} else if x == x.parent.left {
		x.parent.left = y
	} else {
		x.parent.right = y
	}
	y.left = x
	x.parent = y
}

func (t *rbTree) rightRotate(x *rbNode) {
	y := x.left
	x.left = y.right
	if y.right != t.nil {
		y.right.parent = x
	}
	y.parent = x.parent
	if x.parent == t.nil {
		t.root = y
	} else if x == x.parent.right {
		x.parent.right = y
	} else {
		x.parent.left = y
	}
	y.right = x
	x.parent = y
}

func (t *rbTree) deleteKey(key int64) bool {
	z := t.get(key)
	if z == nil {
		return false
	}
	t.deleteNode(z)
	return true
}

func (t *rbTree) transplant(u, v *rbNode) {
	if u.parent == t.nil {
		t.root = v
	} else if u == u.parent.left {
		u.parent.left = v
	} else {
		u.parent.right = v
	}
	v.parent = u.parent
}

func (t *rbTree) deleteNode(z *rbNode) {
	y := z
	yOriginalColor := y.color
	var x *rbNode

	if z.left == t.nil {
		x = z.right
		t.transplant(z, z.right)
	} else if z.right == t.nil {
		x = z.left
		t.transplant(z, z.left)
	} else {
		y = t.minimum(z.right)
		yOriginalColor = y.color
		x = y.right
		if y.parent == z {
			x.parent = y
		} else {
			t.transplant(y, y.right)
			y.right = z.right
			y.right.parent = y
		}
		t.transplant(z, y)
		y.left = z.left
		y.left.parent = y
		y.color = z.color
	}

	if yOriginalColor == rbBlack {
		t.deleteFixup(x)
	}
}

func (t *rbTree) deleteFixup(x *rbNode) {
	for x != t.root && x.color == rbBlack {
		if x == x.parent.left {
			w := x.parent.right
			if w.color == rbRed {
				w.color = rbBlack
				x.parent.color = rbRed
				t.leftRotate(x.parent)
				w = x.parent.right
			}
			if w.left.color == rbBlack && w.right.color == rbBlack {
				w.color = rbRed
				x = x.parent
			} else {
				if w.right.color == rbBlack {
					w.left.color = rbBlack
					w.color = rbRed
					t.rightRotate(w)
					w = x.parent.right
				}
				w.color = x.parent.color
				x.parent.color = rbBlack
				w.right.color = rbBlack
				t.leftRotate(x.parent)
				x = t.root
			}
		} else {
			w := x.parent.left
			if w.color == rbRed {
				w.color = rbBlack
				x.parent.color = rbRed
				t.rightRotate(x.parent)
				w = x.parent.left
			}
			if w.right.color == rbBlack && w.left.color == rbBlack {
				w.color = rbRed
				x = x.parent
			} else {
				if w.left.color == rbBlack {
					w.right.color = rbBlack
					w.color = rbRed
					t.leftRotate(w)
					w = x.parent.left
				}
				w.color = x.parent.color
				x.parent.color = rbBlack
				w.left.color = rbBlack
				t.rightRotate(x.parent)
				x = t.root
			}
		}
	}
	x.color = rbBlack
}

