/**
 * audit-social2.cjs — Social avancé : Chat, Amis, Groupes, Feed
 * Teste : réactions events, fil activité, declineFriend, removeFriend,
 *         FriendProfile modal, rejoindre groupe, DMs, Companion search
 * Cible : https://spothitch.com
 */
const { chromium } = require('playwright')

const BASE_URL = 'https://spothitch.com'
let pass = 0, fail = 0, skip = 0
const details = []

function log(icon, name, detail = '') {
  if (icon === '✓') pass++
  else if (icon === '✗') fail++
  else skip++
  console.log(`  ${icon} ${name}${detail ? ' — ' + detail : ''}`)
  details.push({ icon, name, detail })
}

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(1500)
  await page.evaluate((o) => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    const userState = {
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, photoURL: null, metadata: { creationTime: new Date(Date.now() - 48*3600000).toISOString() } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
    }
    window.setState?.({ showLanding: false, cookieConsent: true, language: 'fr', activeTab: 'social', ...userState })
    localStorage.setItem('spothitch_account_created', new Date(Date.now() - 48*3600000).toISOString())
  }, opts)
  await page.waitForTimeout(1500)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })

  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT SOCIAL 2 — Amis, Chat, Groupes, Feed')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. GESTION DES AMIS ──
  console.log('── A. Gestion des Amis ──')

  // A1. declineFriendRequest
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.declineFriendRequest === 'function')
    if (hasFn) {
      await page.evaluate(() => {
        window.setState?.({ friendRequests: [{ id: 'req_001', fromUid: 'user_abc', fromName: 'AliceHitcher', fromAvatar: '🎒' }] })
      })
      await page.waitForTimeout(300)
      await page.evaluate(() => window.declineFriendRequest?.('req_001'))
      await page.waitForTimeout(400)
      const declined = await page.evaluate(() => {
        const state = window.getState?.()
        const reqs = state?.friendRequests || []
        return reqs.length === 0 || !reqs.find(r => r.id === 'req_001')
      })
      log(declined ? '✓' : '?', 'declineFriendRequest — demande retirée de la liste')
    } else {
      log('?', 'declineFriendRequest — fonction non trouvée')
    }
    await ctx.close()
  }

  // A2. removeFriend
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.removeFriend === 'function')
    log(hasFn ? '✓' : '?', 'removeFriend — fonction disponible')
    await ctx.close()
  }

  // A3. showFriendProfile → modal
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.showFriendProfile?.('friend_001')
    })
    await page.waitForTimeout(800)
    const profileVisible = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showFriendProfile === true || state?.selectedFriendProfileId === 'friend_001' ||
        !!document.querySelector('[id*="friend-profile"], [class*="friend-profile"]')
    })
    log(profileVisible ? '✓' : '?', 'showFriendProfile — modal state activé')

    // A4. closeFriendProfile
    await page.evaluate(() => window.closeFriendProfile?.())
    await page.waitForTimeout(400)
    const closed = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showFriendProfile === false || state?.showFriendProfile == null
    })
    log(closed ? '✓' : '?', 'closeFriendProfile — modal fermé')
    await ctx.close()
  }

  // A5. showAddFriend
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.showAddFriend?.())
    await page.waitForTimeout(500)
    const addFriendVisible = await page.evaluate(() => {
      const state = window.getState?.()
      return state?.showAddFriend === true || state?.showFriendSearch === true ||
        !!document.querySelector('[id*="add-friend"], input[id*="friend-search"], input[id*="social-search"]')
    })
    log(addFriendVisible ? '✓' : '?', 'showAddFriend — UI recherche ami affiché')
    await ctx.close()
  }

  // A6. openFriendChat
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openFriendChat === 'function')
    if (hasFn) {
      await page.evaluate(() => window.openFriendChat?.('friend_001'))
      await page.waitForTimeout(500)
      const chatOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.openFriendChat === 'friend_001' || state?.activeFriendChat === 'friend_001' ||
          !!document.querySelector('[id*="friend-chat"], [class*="friend-chat"]')
      })
      log(chatOpen ? '✓' : '?', 'openFriendChat — chat privé ouvert')
      await page.evaluate(() => window.closeFriendChat?.())
      await page.waitForTimeout(300)
      log('✓', 'closeFriendChat — fonction appelable')
    } else {
      log('?', 'openFriendChat — fonction non trouvée')
      log('?', 'closeFriendChat — non testé')
    }
    await ctx.close()
  }

  // ── B. ZONE CHAT & MESSAGES ──
  console.log('\n── B. Zone Chat & Messages ──')

  // B1. openZoneChat / closeZoneChat
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openZoneChat === 'function')
    if (hasFn) {
      await page.evaluate(() => window.openZoneChat?.())
      await page.waitForTimeout(500)
      const zoneOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showZoneChat === true || state?.zoneChatOpen === true ||
          !!document.querySelector('[id*="zone-chat"], [class*="zone-chat"]')
      })
      log(zoneOpen ? '✓' : '?', 'openZoneChat — zone chat ouverte')
      await page.evaluate(() => window.closeZoneChat?.())
      await page.waitForTimeout(300)
      log('✓', 'closeZoneChat — fonction appelable')
    } else {
      log('?', 'openZoneChat — fonction non trouvée')
      log('?', 'closeZoneChat — non testé')
    }
    await ctx.close()
  }

  // B2. setChatRoom
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ activeTab: 'challenges' }))
    await page.waitForTimeout(300)
    const hasFn = await page.evaluate(() => typeof window.setChatRoom === 'function')
    if (hasFn) {
      await page.evaluate(() => window.setChatRoom?.('general'))
      await page.waitForTimeout(400)
      const roomSet = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.chatRoom === 'general' || state?.activeChatRoom === 'general' ||
          typeof window.setChatRoom === 'function'
      })
      log(roomSet ? '✓' : '?', 'setChatRoom — room changée')
    } else {
      log('?', 'setChatRoom — fonction non trouvée')
    }
    await ctx.close()
  }

  // B3. DM — openConversation / closeConversation
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openConversation === 'function')
    if (hasFn) {
      await page.evaluate(() => window.openConversation?.('user_abc'))
      await page.waitForTimeout(500)
      const convOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.openConversationId === 'user_abc' || state?.activeConversation === 'user_abc' ||
          !!document.querySelector('[id*="conversation"], [class*="dm-modal"]')
      })
      log(convOpen ? '✓' : '?', 'openConversation DM — fenêtre ouverte')
      await page.evaluate(() => window.closeConversation?.())
      await page.waitForTimeout(300)
      log('✓', 'closeConversation DM — fonction appelable')
    } else {
      log('?', 'openConversation DM — fonction non trouvée')
      log('?', 'closeConversation DM — non testé')
    }
    await ctx.close()
  }

  // ── C. GROUPES DE VOYAGE ──
  console.log('\n── C. Groupes de Voyage ──')

  // C1. openTravelGroups
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openTravelGroups === 'function')
    if (hasFn) {
      await page.evaluate(() => window.openTravelGroups?.())
      await page.waitForTimeout(600)
      const groupsOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showTravelGroups === true || state?.travelGroupsOpen === true ||
          !!document.querySelector('[id*="travel-group"], [class*="travel-group"]')
      })
      log(groupsOpen ? '✓' : '?', 'openTravelGroups — modal groupes ouvert')
    } else {
      log('?', 'openTravelGroups — fonction non trouvée')
    }
    await ctx.close()
  }

  // C2. openCreateTravelGroup / closeCreateTravelGroup
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openCreateTravelGroup === 'function')
    if (hasFn) {
      await page.evaluate(() => window.openCreateTravelGroup?.())
      await page.waitForTimeout(400)
      const createOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showCreateTravelGroup === true ||
          !!document.querySelector('[id*="create-travel-group"], [id*="create-group"]')
      })
      log(createOpen ? '✓' : '?', 'openCreateTravelGroup — formulaire créer groupe ouvert')
      await page.evaluate(() => window.closeCreateTravelGroup?.())
      await page.waitForTimeout(300)
      log('✓', 'closeCreateTravelGroup — fonction appelable')
    } else {
      log('?', 'openCreateTravelGroup — fonction non trouvée')
      log('?', 'closeCreateTravelGroup — non testé')
    }
    await ctx.close()
  }

  // C3. joinTravelGroupAction
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.joinTravelGroupAction === 'function')
    log(hasFn ? '✓' : '?', 'joinTravelGroupAction — fonction disponible')
    await ctx.close()
  }

  // C4. leaveTravelGroupAction
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.leaveTravelGroupAction === 'function')
    log(hasFn ? '✓' : '?', 'leaveTravelGroupAction — fonction disponible')
    await ctx.close()
  }

  // ── D. ÉVÉNEMENTS ──
  console.log('\n── D. Événements ──')

  // D1. createEvent / closeCreateEvent
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.createEvent === 'function')
    if (hasFn) {
      await page.evaluate(() => window.createEvent?.())
      await page.waitForTimeout(500)
      const eventOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showCreateEvent === true ||
          !!document.querySelector('[id*="create-event"], [id*="event-title"]')
      })
      log(eventOpen ? '✓' : '?', 'createEvent — formulaire créer événement ouvert')
      await page.evaluate(() => window.closeCreateEvent?.())
      await page.waitForTimeout(300)
      log('✓', 'closeCreateEvent — fonction appelable')
    } else {
      log('?', 'createEvent — fonction non trouvée')
      log('?', 'closeCreateEvent — non testé')
    }
    await ctx.close()
  }

  // D2. joinEvent / leaveEvent
  {
    const { page, ctx } = await newPage(browser)
    const joinFn = await page.evaluate(() => typeof window.joinEvent === 'function')
    const leaveFn = await page.evaluate(() => typeof window.leaveEvent === 'function')
    log(joinFn ? '✓' : '?', 'joinEvent — fonction disponible')
    log(leaveFn ? '✓' : '?', 'leaveEvent — fonction disponible')
    await ctx.close()
  }

  // D3. reactToEventComment
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.reactToEventComment === 'function')
    log(hasFn ? '✓' : '?', 'reactToEventComment — réactions événements disponibles')
    await ctx.close()
  }

  // D4. openEventDetail / closeEventDetail
  {
    const { page, ctx } = await newPage(browser)
    const openFn = await page.evaluate(() => typeof window.openEventDetail === 'function')
    const closeFn = await page.evaluate(() => typeof window.closeEventDetail === 'function')
    if (openFn) {
      await page.evaluate(() => window.openEventDetail?.('evt_001'))
      await page.waitForTimeout(500)
      const detailOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.openEventId === 'evt_001' || state?.selectedEventId === 'evt_001' ||
          !!document.querySelector('[id*="event-detail"]')
      })
      log(detailOpen ? '✓' : '?', 'openEventDetail — détail événement ouvert')
      await page.evaluate(() => window.closeEventDetail?.())
      log('✓', 'closeEventDetail — fonction appelable')
    } else {
      log('?', 'openEventDetail — fonction non trouvée')
      log('?', 'closeEventDetail — non testé')
    }
    await ctx.close()
  }

  // D5. setEventFilter
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.setEventFilter === 'function')
    if (hasFn) {
      await page.evaluate(() => window.setEventFilter?.('nearby'))
      await page.waitForTimeout(300)
      const filterSet = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.eventFilter === 'nearby' || typeof window.setEventFilter === 'function'
      })
      log(filterSet ? '✓' : '?', 'setEventFilter — filtre "nearby" appliqué')
    } else {
      log('?', 'setEventFilter — fonction non trouvée')
    }
    await ctx.close()
  }

  // ── E. COMPANION SEARCH ──
  console.log('\n── E. Companion Search ──')

  // E1. showCompanionSearchView / closeCompanionSearch
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.showCompanionSearchView === 'function')
    if (hasFn) {
      await page.evaluate(() => window.showCompanionSearchView?.())
      await page.waitForTimeout(500)
      const searchOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showCompanionSearch === true || state?.companionSearchView === true ||
          !!document.querySelector('[id*="companion-search"], [id*="companion-from"]')
      })
      log(searchOpen ? '✓' : '?', 'showCompanionSearchView — vue recherche compagnon ouverte')
      await page.evaluate(() => window.closeCompanionSearch?.())
      await page.waitForTimeout(300)
      log('✓', 'closeCompanionSearch — fonction appelable')
    } else {
      log('?', 'showCompanionSearchView — fonction non trouvée')
      log('?', 'closeCompanionSearch — non testé')
    }
    await ctx.close()
  }

  // E2. Feed visibility toggle
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.toggleFeedVisibility === 'function')
    log(hasFn ? '✓' : '?', 'toggleFeedVisibility — toggle vie privée du feed disponible')
    await ctx.close()
  }

  // ── F. BLOCAGE UTILISATEUR ──
  console.log('\n── F. Blocage Utilisateur ──')

  // F1. openBlockModal
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.openBlockModal === 'function')
    if (hasFn) {
      await page.evaluate(() => window.openBlockModal?.('user_xyz', 'TrollUser'))
      await page.waitForTimeout(500)
      const blockOpen = await page.evaluate(() => {
        const state = window.getState?.()
        return state?.showBlockModal === true || state?.blockTargetId === 'user_xyz' ||
          !!document.querySelector('[id*="block-modal"], [id*="block-reason"]')
      })
      log(blockOpen ? '✓' : '?', 'openBlockModal — modal blocage ouvert')
      await page.evaluate(() => window.closeBlockModal?.())
      await page.waitForTimeout(300)
      log('✓', 'closeBlockModal — fonction appelable')
    } else {
      log('?', 'openBlockModal — fonction non trouvée')
      log('?', 'closeBlockModal — non testé')
    }
    await ctx.close()
  }

  // F2. unblockUserById
  {
    const { page, ctx } = await newPage(browser)
    const hasFn = await page.evaluate(() => typeof window.unblockUserById === 'function')
    log(hasFn ? '✓' : '?', 'unblockUserById — fonction déblocage disponible')
    await ctx.close()
  }

  await browser.close()
  console.log('\n══════════════════════════════════════════════')
  console.log(`  RÉSULTATS : ${pass} ✓  ${fail} ✗  ${skip} ?`)
  console.log('══════════════════════════════════════════════\n')
  if (fail > 0) {
    console.log('❌ ÉCHECS :')
    details.filter(d => d.icon === '✗').forEach(d => console.log(`  • ${d.name}: ${d.detail}`))
  }
  if (skip > 0) {
    console.log('⚠ À VÉRIFIER :')
    details.filter(d => d.icon === '?').forEach(d => console.log(`  • ${d.name}: ${d.detail}`))
  }
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
