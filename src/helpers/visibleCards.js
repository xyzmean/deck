/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Карточки колонки в том же наборе, в каком их рисует сама колонка: с учётом
 * активного фильтра (это уже делает геттер cardsByStack) и режима «показывать
 * архивные».
 *
 * Вынесено в helper, потому что этот набор считают теперь в двух местах —
 * колонка для своего счётчика и шапка доски для плашки «N карточек». Если
 * условие разъедется, сумма счётчиков колонок перестанет сходиться с числом в
 * шапке, а это первое, что видно на экране.
 *
 * @param {object} store хранилище Vuex
 * @param {number} stackId идентификатор колонки
 * @param {boolean} showArchived показывать архивные карточки вместо обычных
 * @return {Array} карточки колонки
 */
export function visibleCardsByStack(store, stackId, showArchived) {
	return store.getters.cardsByStack(stackId)
		.filter((card) => (showArchived ? card.archived : !card.archived))
}

/**
 * Сколько карточек видно на доске — сумма по её колонкам.
 *
 * @param {object} store хранилище Vuex
 * @param {number} boardId идентификатор доски
 * @param {boolean} showArchived показывать архивные карточки вместо обычных
 * @return {number} число карточек
 */
export function visibleCardsCountByBoard(store, boardId, showArchived) {
	return store.getters.stacksByBoard(boardId)
		.reduce((total, stack) => total + visibleCardsByStack(store, stack.id, showArchived).length, 0)
}
