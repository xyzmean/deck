<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div v-if="members.length > 1"
		class="board-members"
		:style="{ '--nc-board-members-size': size + 'px' }"
		role="list"
		:aria-label="t('deck', 'Members')">
		<!-- Порядок наложения оставлен естественным (следующий аватар поверх
		     предыдущего), как в макете: тогда обводка следующего съедает у
		     предыдущего правый край, а не первую букву инициалов. -->
		<div v-for="member in membersVisible"
			:key="member.uid"
			class="board-members__item"
			:class="{ 'board-members__item--present': isPresent(member) }"
			role="listitem">
			<NcAvatar :user="member.uid"
				:display-name="member.displayname"
				:is-no-user="member.type !== 0"
				:disable-menu="true"
				:hide-status="true"
				:size="size" />
		</div>
		<!-- Остаток стопки: только число, без нового текста, чтобы плашка
		     не оказалась непереведённой в нерусской сборке. -->
		<div v-if="overflowCount > 0"
			class="board-members__item board-members__item--more"
			role="listitem"
			:title="overflowNames">
			+{{ overflowCount }}
		</div>
	</div>
</template>

<script>
import { NcAvatar } from '@nextcloud/vue'

/**
 * Сколько аватаров показываем до плашки «+N». В макете стопка из трёх; на
 * четырёх строка шапки ещё не начинает конкурировать с кнопками.
 */
const VISIBLE_LIMIT = 4

export default {
	name: 'BoardMembers',
	components: {
		NcAvatar,
	},
	props: {
		board: {
			type: Object,
			required: true,
		},
		size: {
			type: Number,
			default: 28,
		},
	},
	computed: {
		/**
		 * Владелец доски первым, дальше остальные по видимому имени: у стопки
		 * должен быть устойчивый порядок, иначе аватары переставляются на
		 * каждой перезагрузке вслед за порядком записей ACL.
		 */
		members() {
			const users = this.board?.users ?? []
			const ownerUid = this.board?.owner?.uid
			return [...users].sort((a, b) => {
				if (a.uid === ownerUid) return -1
				if (b.uid === ownerUid) return 1
				return (a.displayname ?? a.uid).localeCompare(b.displayname ?? b.uid)
			})
		},
		membersVisible() {
			return this.members.length > VISIBLE_LIMIT
				? this.members.slice(0, VISIBLE_LIMIT - 1)
				: this.members
		},
		overflowCount() {
			return this.members.length - this.membersVisible.length
		},
		overflowNames() {
			return this.members.slice(this.membersVisible.length)
				.map((member) => member.displayname ?? member.uid)
				.join(', ')
		},
	},
	methods: {
		/**
		 * Кто сейчас на доске. Раньше это показывал отдельный SessionList
		 * рядом; теперь та же информация лежит на общей стопке кольцом, чтобы
		 * в шапке была одна стопка аватаров, как в макете.
		 *
		 * @param {object} member запись участника из board.users
		 * @return {boolean} открыта ли у него сейчас эта доска
		 */
		isPresent(member) {
			return (this.board?.activeSessions ?? []).includes(member.uid)
		},
	},
}
</script>

<style scoped lang="scss">
.board-members {
	display: flex;
	flex-direction: row;
	align-items: center;
	flex: 0 0 auto;
}

.board-members__item {
	position: relative;
	/* Размер задаём обёртке явно: NcAvatar рендерит .avatardiv как
	   inline-block, и обёртка без этого получает высоту строки (34.5px при
	   аватаре 28px — замерено), из-за чего круглая обводка становится
	   овалом вокруг аватара. */
	display: flex;
	box-sizing: border-box;
	width: var(--nc-board-members-size);
	height: var(--nc-board-members-size);
	border-radius: 50%;
	/* Обводка цветом подложки шапки: она и даёт зазор между аватарами,
	   когда они наезжают друг на друга. */
	box-shadow: 0 0 0 2px var(--color-main-background);

	& + & {
		margin-inline-start: -8px;
	}
}

.board-members__item--present {
	box-shadow: 0 0 0 2px var(--color-main-background), 0 0 0 4px var(--color-success);
}

.board-members__item--more {
	align-items: center;
	justify-content: center;
	background-color: var(--color-background-dark);
	color: var(--color-text-maxcontrast);
	font-size: 11px;
	font-weight: 700;
	line-height: 1;
}
</style>
