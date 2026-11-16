/**
 * Dialogue is generated from the current quest state.
 * Actions are applied by WorldScene after the last line is closed.
 */
export function getDialogue(npcId, state) {
  if (npcId === 'elder') {
    if (state.isQuestActive('welcome')) {
      return {
        lines: [
          'Selamat datang di Desa Lembah Hijau, petualang!',
          'Akhir-akhir ini slime hijau menyeberangi sungai dan merusak ladang kami.',
          'Bisakah kamu mengalahkan 4 slime di hutan seberang? Jembatan kayu ada di sebelah timur.'
        ],
        actions: [
          { type: 'track', kind: 'talk', target: 'elder', amount: 1 },
          { type: 'startQuest', id: 'slime_hunt' }
        ]
      };
    }

    if (state.isQuestActive('slime_hunt')) {
      const killed = state.getQuestProgress('slime_hunt', 0);
      return {
        lines: [
          `Slime yang sudah kamu kalahkan: ${killed}/4.`,
          killed === 0
            ? 'Seberangi jembatan kayu di timur desa. Hati-hati, slime bisa melompat ke arahmu.'
            : 'Teruskan! Ladang kami bergantung pada keberanianmu.'
        ],
        actions: []
      };
    }

    if (state.isQuestCompleted('slime_hunt')) {
      return {
        lines: [
          'Terima kasih, pahlawan! Ladang kami akhirnya bisa bernapas lega.',
          'Pak Tani di dekat kebun sedang mencari bantuan untuk panen pertamanya.'
        ],
        actions: []
      };
    }

    return {
      lines: ['Desa ini damai... semoga tetap begitu.'],
      actions: []
    };
  }

  if (npcId === 'farmer') {
    if (!state.quests.first_harvest) {
      return {
        lines: [
          'Halo, namaku Pak Tani. Kebun ini sudah lama tidak diurus.',
          'Coba cangkul lahan, tanam Bibit Lobak, lalu panen 3 Lobak.',
          'Bibitnya ada di peti depan rumah. Tekan ACT saat dekat peti, lalu dekat lahan.'
        ],
        actions: [
          { type: 'startQuest', id: 'first_harvest' }
        ]
      };
    }

    if (state.isQuestActive('first_harvest')) {
      const harvested = state.getQuestProgress('first_harvest', 0);
      return {
        lines: [
          `Panen pertamamu: ${harvested}/3 Lobak.`,
          'Lobak butuh sekitar 30 detik untuk tumbuh. Sabar, ya!'
        ],
        actions: []
      };
    }

    return {
      lines: [
        'Kebunmu subur! Kalau butuh bibit lagi, buka peti atau minta hadiah dari pedagang.'
      ],
      actions: []
    };
  }

  if (npcId === 'merchant') {
    if (!state.flags.merchantGift) {
      return {
        lines: [
          'Hei, petualang! Aku baru datang dengan barang dagangan.',
          'Ambil Ramuan Herbal ini sebagai hadiah perkenalan. Sekali saja, ya!'
        ],
        actions: [
          { type: 'giveItem', id: 'potion', amount: 1, once: 'merchantGift' }
        ]
      };
    }

    return {
      lines: [
        'Gel Slime dan Tulang Kuno bisa jadi bahan berharga nanti.',
        'Rajinlah bertarung dan bertani. Desa ini butuh orang sepertimu.'
      ],
      actions: []
    };
  }

  return {
    lines: ['...'],
    actions: []
  };
}
