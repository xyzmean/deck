/**
 * SPDX-FileCopyrightText: 2026 xcloud
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Part of the xcloud fork: where a board or a card is discussed in Chat.
 *
 * The answer lives in xcloud_matrix, which links group boards to their rooms
 * and cards to the messages of their tasks. It only answers with a room the
 * asking user is in, and answers 404 otherwise — also when xcloud_matrix is
 * not installed at all — so "no link" is a normal outcome, not an error.
 */
import axios from '@nextcloud/axios'
import { generateOcsUrl, generateUrl } from '@nextcloud/router'

/**
 * @param {'boards'|'cards'} kind What to ask about
 * @param {number} id Board or card id
 * @return {Promise<string|null>} Address of the embedded Chat, or null
 */
export async function chatLink(kind, id) {
	if (!id) {
		return null
	}
	try {
		const response = await axios.get(generateOcsUrl('apps/xcloud_matrix/api/v1/deck/{kind}/{id}/chat', { kind, id }))
		const { room, event } = response.data.ocs.data
		return room ? chatUrl(room, event) : null
	} catch (e) {
		return null
	}
}

/**
 * The embedded Element takes Element's own routes in the hash:
 * #/room/<room id>[/<event id>] opens the room scrolled to the message.
 *
 * @param {string} room Matrix room id
 * @param {string} event Matrix event id, may be empty
 * @return {string}
 */
export function chatUrl(room, event) {
	return generateUrl('/apps/xcloud_embed/') + '#/room/' + encodeURIComponent(room)
		+ (event ? '/' + encodeURIComponent(event) : '')
}
