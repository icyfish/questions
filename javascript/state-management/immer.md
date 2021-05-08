

### 不使用 immer 管理状态:

```js
export function addGift(state, id, description, image) {
  return {
    ...state,
    gifts: [
      ...state.gifts,
      {
        id,
        description,
        image,
        reservedBy: undefined
      }
    ]
  };
}

export function toggleReservation(state, giftId) {
  return {
    ...state,
    gifts: state.gifts.map(gift => {
      if (gift.id !== giftId) return gift;
      return {
        ...gift,
        reservedBy:
          gift.reservedBy === undefined
            ? state.currentUser.id
            : gift.reservedBy === state.currentUser.id
            ? undefined
            : gift.reservedBy
      };
    })
  };
}
```

### 使用 immer:

```js
export function addGift(state, id, description, image) {
  return produce(state, draft => {
    draft.gifts.push({
      id,
      description,
      image,
      reservedBy: undefined
    });
  });
}

export function toggleReservation(state, giftId) {
  return produce(state, draft => {
    const gift = draft.gifts.find(gift => gift.id === giftId);
    gift.reservedBy =
      gift.reservedBy === undefined
        ? state.currentUser.id
        : gift.reservedBy === state.currentUser.id
        ? undefined
        : gift.reservedBy;
  });
}
```

### 使用 immer (柯里化的形式)

```js
export const addGift = produce((draft, id, description, image) => {
  draft.gifts.push({
    id,
    description,
    image,
    reservedBy: undefined
  });
});
```