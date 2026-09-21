<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<li v-if="members.length > 1" class="board-members-list">
		<div class="board-members-list__caption">
			{{ t('deck', 'Board members') }}
		</div>
		<ul class="board-members-list__items">
			<li v-for="member in members" :key="member.uid" class="board-members-list__item">
				<NcAvatar :user="member.uid"
					:display-name="member.displayname"
					:is-no-user="member.type !== 0"
					:disable-menu="true"
					:hide-status="true"
					:size="26" />
				<span class="board-members-list__name">{{ member.displayname || member.uid }}</span>
				<!-- Роль подписана только у владельца: остальные различаются
				     правами, а права это уже не «кто здесь», а «что кому
				     можно» — они и живут в общем доступе на боковой панели. -->
				<span v-if="member.uid === ownerUid" class="board-members-list__role">
					{{ t('deck', 'Board owner') }}
				</span>
			</li>
		</ul>
	</li>
</template>

<script>
import { NcAvatar } from '@nextcloud/vue'

/**
 * Состав доски под списком досок — так это нарисовано в макете.
 *
 * Тем же составом и в том же порядке, что и стопка аватаров в шапке
 * (BoardMembers): владелец первым, дальше по видимому имени. Два разных
 * порядка на одной странице читались бы как два разных состава.
 *
 * Показывается только там, где есть что показывать: на доске, которую человек
 * ни с кем не делит, «участники» из одного себя — строка ни о чём.
 */
export default {
	name: 'AppNavigationBoardMembers',
	components: {
		NcAvatar,
	},
	props: {
		board: {
			type: Object,
			required: true,
		},
	},
	computed: {
		ownerUid() {
			return this.board?.owner?.uid
		},
		members() {
			const users = this.board?.users ?? []
			const ownerUid = this.ownerUid
			return [...users].sort((a, b) => {
				if (a.uid === ownerUid) return -1
				if (b.uid === ownerUid) return 1
				return (a.displayname ?? a.uid).localeCompare(b.displayname ?? b.uid)
			})
		},
	},
}
</script>

<style scoped lang="scss">
.board-members-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 12px 18px 18px 18px;
	/* Отбивка от списка досок — та же линия, что отделяет разделы в макете. */
	border-top: 1px solid var(--color-border);
	margin-top: 6px;
}

.board-members-list__caption {
	font-size: 11.5px;
	font-weight: 600;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	color: var(--color-text-maxcontrast);
}

.board-members-list__items {
	display: flex;
	flex-direction: column;
	gap: 9px;
}

.board-members-list__item {
	display: flex;
	align-items: center;
	gap: 9px;
	min-width: 0;
}

.board-members-list__name {
	flex-grow: 1;
	min-width: 0;
	font-size: 13.5px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.board-members-list__role {
	flex: 0 0 auto;
	font-size: 11.5px;
	color: var(--color-text-maxcontrast);
}
</style>
