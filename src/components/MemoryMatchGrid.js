import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const ICON_SET = ['⭐', '❤️', '⚡', '🔥', '🌙', '🌿', '💎', '🎯', '🍀', '🎈', '🧩', '🪐'];

function shuffledDeck(pairsCount) {
  const icons = ICON_SET.slice(0, pairsCount);
  const deck = [...icons, ...icons].map((emoji, idx) => ({
    emoji,
    uid: `${emoji}-${idx}-${Math.random()}`,
    pairKey: emoji,
  }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Controlled-ish memory match grid. Calls onComplete({ flips, timeSeconds })
 * once all pairs are matched. Calling code owns the alarm sound / dismiss
 * logic; this component is purely the game.
 */
export default function MemoryMatchGrid({ pairsRequired, onComplete, onProgress }) {
  const deck = useMemo(() => shuffledDeck(pairsRequired), [pairsRequired]);
  const [flippedUids, setFlippedUids] = useState([]);
  const [matchedKeys, setMatchedKeys] = useState(new Set());
  const [flips, setFlips] = useState(0);
  const [locked, setLocked] = useState(false);
  const startTimeRef = useRef(Date.now());

  const handlePress = useCallback(
    (card) => {
      if (locked) return;
      if (flippedUids.includes(card.uid)) return;
      if (matchedKeys.has(card.pairKey) && flippedUids.length === 0) return;

      const nextFlipped = [...flippedUids, card.uid];
      setFlippedUids(nextFlipped);

      if (nextFlipped.length === 1) {
        return;
      }

      // second card flipped
      const newFlipCount = flips + 1;
      setFlips(newFlipCount);
      setLocked(true);

      const firstCard = deck.find((c) => c.uid === nextFlipped[0]);
      const isMatch = firstCard.pairKey === card.pairKey;

      if (isMatch) {
        const newMatched = new Set(matchedKeys);
        newMatched.add(card.pairKey);
        setMatchedKeys(newMatched);
        setFlippedUids([]);
        setLocked(false);

        onProgress?.({ matched: newMatched.size, total: pairsRequired, flips: newFlipCount });

        if (newMatched.size === pairsRequired) {
          const timeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
          onComplete?.({ flips: newFlipCount, timeSeconds });
        }
      } else {
        setTimeout(() => {
          setFlippedUids([]);
          setLocked(false);
        }, 800);
      }
    },
    [flippedUids, matchedKeys, locked, flips, deck, pairsRequired, onComplete, onProgress]
  );

  const columns = 4;

  return (
    <View style={styles.grid}>
      {deck.map((card) => {
        const isFlipped = flippedUids.includes(card.uid) || matchedKeys.has(card.pairKey);
        const isMatched = matchedKeys.has(card.pairKey);
        return (
          <TouchableOpacity
            key={card.uid}
            activeOpacity={0.8}
            style={[
              styles.card,
              { width: `${100 / columns - 2}%` },
              isMatched && styles.cardMatched,
            ]}
            onPress={() => handlePress(card)}
            disabled={isFlipped}
          >
            <Text style={styles.cardText}>{isFlipped ? card.emoji : '?'}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    aspectRatio: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a58',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardMatched: {
    backgroundColor: '#0b2418',
    borderColor: '#1D9E75',
  },
  cardText: {
    fontSize: 24,
    color: '#666',
  },
});
