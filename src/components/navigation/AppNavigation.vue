<!--
  - SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<NcAppNavigation :class="{'icon-loading': loading}">
		<!-- Название раздела и «+» одной строкой, как в макете и как у Задач.
		     «+» — меню из двух действий, потому что пунктов «Добавить доску» и
		     «Импортировать доску» в списке больше нет: их место в макете
		     занимают сами доски. -->
		<template #search>
			<div class="navigation-heading">
				<h2 class="navigation-heading__name">
					{{ t('deck', 'Boards') }}
				</h2>
				<NcActions v-if="canCreate"
					:aria-label="t('deck', 'Add board')"
					:title="t('deck', 'Add board')"
					variant="secondary">
					<template #icon>
						<PlusIcon :size="20" />
					</template>
					<NcActionButton :close-after-click="true" @click="startCreateBoard">
						<template #icon>
							<PlusIcon :size="20" />
						</template>
						{{ t('deck', 'Add board') }}
					</NcActionButton>
					<NcActionButton :close-after-click="true" @click="startImportBoard">
						<template #icon>
							<UploadIcon :size="20" />
						</template>
						{{ t('deck', 'Import board') }}
					</NcActionButton>
				</NcActions>
			</div>
		</template>
		<template #list>
			<NcAppNavigationItem :name="t('deck', 'Upcoming cards')"
				:exact="true"
				to="/upcoming">
				<template #icon>
					<CalendarIcon v-if="$route.path === '/upcoming'" :size="20" />
					<CalendarOutlineIcon v-else :size="20" />
				</template>
			</NcAppNavigationItem>
			<!-- Доски — прямо в списке, а не внутри раскрывающегося «Все доски»:
			     в макете список плоский, а вложенность съедала отступ, и название
			     активной доски обрезалось рядом с её кнопками. -->
			<AppNavigationBoard v-for="board in noneArchivedBoardsSorted"
				:key="board.id"
				:board="board" />
			<AppNavigationAddBoard v-if="canCreate" ref="addBoard" :entry="false" />
			<AppNavigationBoardCategory id="deck-navigation-archived"
				to="/board/archived"
				:text="t('deck', 'Archived boards')"
				:boards="archivedBoards">
				<template #icon>
					<ArchiveIcon v-if="$route.path === '/board/archived'" :size="20" decorative />
					<ArchiveOutlineIcon v-else :size="20" decorative />
				</template>
			</AppNavigationBoardCategory>
			<AppNavigationBoardCategory id="deck-navigation-shared"
				to="/board/shared"
				:text="t('deck', 'Shared with you')"
				:boards="sharedBoards"
				icon="icon-shared">
				<template #icon>
					<ShareVariantIcon :size="20" decorative />
				</template>
			</AppNavigationBoardCategory>
			<AppNavigationImportBoard v-if="canCreate" ref="importBoard" :entry="false" />
			<!-- Состав доски под списком досок, как в макете. Здесь, а не в
			     шапке: шапка показывает стопкой, кто есть, а колонка — кто
			     именно и в какой роли. Внутри #list, а не в #default: слот по
			     умолчанию у NcAppNavigation рисуется ДО списка, и блок
			     оказывался над ним. -->
			<AppNavigationBoardMembers v-if="currentBoard" :board="currentBoard" />
		</template>
		<template #default>
			<DeckAppSettings :open.sync="settingsOpened"
				@close="onSettingsClose" />
		</template>
		<template #footer>
			<ul class="app-navigation-entry__settings">
				<NcAppNavigationItem :name="t('deck', 'Deck settings')"
					@click.prevent.stop="openSettings">
					<template #icon>
						<IconCog :size="20" />
					</template>
				</NcAppNavigationItem>
			</ul>
		</template>
	</NcAppNavigation>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ClickOutside from 'vue-click-outside'
import { NcActionButton, NcActions, NcAppNavigation, NcAppNavigationItem } from '@nextcloud/vue'
import AppNavigationAddBoard from './AppNavigationAddBoard.vue'
import AppNavigationBoard from './AppNavigationBoard.vue'
import AppNavigationBoardCategory from './AppNavigationBoardCategory.vue'
import AppNavigationBoardMembers from './AppNavigationBoardMembers.vue'
import { loadState } from '@nextcloud/initial-state'
import ArchiveIcon from 'vue-material-design-icons/Archive.vue'
import ArchiveOutlineIcon from 'vue-material-design-icons/ArchiveOutline.vue'
import CalendarIcon from 'vue-material-design-icons/Calendar.vue'
import CalendarOutlineIcon from 'vue-material-design-icons/CalendarOutline.vue'
import ShareVariantIcon from 'vue-material-design-icons/ShareOutline.vue'
import { subscribe } from '@nextcloud/event-bus'
import AppNavigationImportBoard from './AppNavigationImportBoard.vue'
import DeckAppSettings from '../DeckAppSettings.vue'
import IconCog from 'vue-material-design-icons/CogOutline.vue'
import PlusIcon from 'vue-material-design-icons/Plus.vue'
import UploadIcon from 'vue-material-design-icons/TrayArrowUp.vue'
import { getCurrentUser } from '@nextcloud/auth'

const canCreateState = loadState('deck', 'canCreate')

export default {
	name: 'AppNavigation',
	components: {
		NcActionButton,
		NcActions,
		NcAppNavigation,
		AppNavigationAddBoard,
		AppNavigationBoard,
		AppNavigationBoardCategory,
		AppNavigationBoardMembers,
		AppNavigationImportBoard,
		NcAppNavigationItem,
		ArchiveIcon,
		ArchiveOutlineIcon,
		CalendarIcon,
		CalendarOutlineIcon,
		ShareVariantIcon,
		DeckAppSettings,
		IconCog,
		PlusIcon,
		UploadIcon,
	},
	directives: {
		ClickOutside,
	},
	props: {
		loading: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			opened: false,
			groups: [],
			groupLimit: [],
			groupLimitDisabled: true,
			canCreate: canCreateState,
			showHelp: false,
			settingsOpened: false,
		}
	},
	computed: {
		...mapGetters([
			'noneArchivedBoards',
			'archivedBoards',
			'sharedBoards',
		]),
		...mapState({
			currentBoard: (state) => state.currentBoard,
		}),
		noneArchivedBoardsSorted() {
			return [...this.noneArchivedBoards].sort((a, b) => a.title.localeCompare(b.title))
		},
		isAdmin() {
			return !!getCurrentUser()?.isAdmin
		},
		cardDetailsInModal: {
			get() {
				return this.$store.getters.config('cardDetailsInModal')
			},
			set(newValue) {
				this.$store.dispatch('setConfig', { cardDetailsInModal: newValue })
			},
		},
		cardIdBadge: {
			get() {
				return this.$store.getters.config('cardIdBadge')
			},
			set(newValue) {
				this.$store.dispatch('setConfig', { cardIdBadge: newValue })
			},
		},
		configCalendar: {
			get() {
				return this.$store.getters.config('calendar')
			},
			set(newValue) {
				this.$store.dispatch('setConfig', { calendar: newValue })
			},
		},
	},
	mounted() {
		subscribe('deck:global:toggle-help-dialog', () => {
			this.showHelp = !this.showHelp
		})
	},
	methods: {
		startCreateBoard() {
			this.$refs.addBoard.startCreateBoard()
		},
		startImportBoard() {
			this.$refs.importBoard.startImportBoard()
		},
		openSettings() {
			this.settingsOpened = true
		},
		onSettingsClose() {
			this.settingsOpened = false
		},
	},
}
</script>
<style scoped lang="scss">
	#app-settings-content {
		p {
			margin-top: 20px;
			margin-bottom: 20px;
			color: var(--color-text-light);
		}
	}

	.app-navigation-entry__settings {
		height: auto !important;
		overflow: hidden !important;
		padding-top: 0 !important;
		// Prevent shrinking or growing
		flex: 0 0 auto;
	}
</style>
