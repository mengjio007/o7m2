package chat

import (
	"crypto/sha1"
	"encoding/hex"
)

func DefaultSessionID(userID, characterID string) string {
	sum := sha1.Sum([]byte(userID + "|" + characterID))
	return hex.EncodeToString(sum[:])[:16]
}
