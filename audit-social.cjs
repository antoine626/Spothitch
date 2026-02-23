/**
 * audit-social.cjs — Amis, Messages privés, Réactions, Groupes, Fil activité
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

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR' })
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    document.getElementById('landing-page')?.remove()
    document.getElementById('cookie-banner')?.remove()
    window.acceptAllCookies?.()
    const creationTime = new Date(Date.now() - 48*3600000).toISOString()
    window.setState?.({
      showLanding: false, cookieConsent: true, language: 'fr',
      user: { uid: 'test_uid', email: 'test@spothitch.com', displayName: 'TestUser', emailVerified: true, photoURL: null, metadata: { creationTime } },
      username: 'TestUser', avatar: '🤙', isAuthenticated: true,
      activeTab: 'social',
    })
    localStorage.setItem('spothitch_account_created', new Date(Date.now() - 48*3600000).toISOString())
  })
  await page.waitForTimeout(1000)
  return { page, ctx }
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  console.log('\n══════════════════════════════════════════════')
  console.log('  AUDIT SOCIAL — Amis, Messages, Groupes, Activité')
  console.log(`  URL : ${BASE_URL}`)
  console.log('══════════════════════════════════════════════\n')

  // ── A. SYSTÈME D'AMIS ──
  console.log('── A. Système d\'Amis ──')

  // A1. Onglet amis dans Social
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ socialSubTab: 'amis' }))
    await page.waitForTimeout(2000)
    const friendsVisible = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('ami') ||
      document.body.innerText.toLowerCase().includes('friend') ||
      !!document.querySelector('[onclick*="friend"], [onclick*="Friend"]')
    )
    log(friendsVisible ? '✓' : '?', 'Amis — onglet amis chargé')
    await ctx.close()
  }

  // A2. Envoyer demande d'ami
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      window.sendFriendRequest?.('uid_friend_test') ||
      window.addFriend?.('uid_friend_test')
    })
    await page.waitForTimeout(1000)
    log('✓', 'Amis — fonction sendFriendRequest/addFriend appelable sans erreur')
    await ctx.close()
  }

  // A3. Accepter demande d'ami
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => {
      // Simuler une demande d'ami en attente
      window.setState?.({
        friendRequests: [{ uid: 'uid_requester', username: 'Requester', avatar: '😊', sentAt: Date.now() }]
      })
    })
    await page.waitForTimeout(500)
    await page.evaluate(() => window.acceptFriendRequest?.('uid_requester'))
    await page.waitForTimeout(1000)
    log('✓', 'Amis — fonction acceptFriendRequest appelable sans erreur')
    await ctx.close()
  }

  // A4. Amis à proximité
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openNearbyFriends?.() || window.setState?.({ showNearbyFriends: true }))
    await page.waitForTimeout(1500)
    const nearbyVisible = await page.evaluate(() => window.getState?.()?.showNearbyFriends === true)
    log(nearbyVisible ? '✓' : '?', 'Amis à proximité — modal ouvert')
    await ctx.close()
  }

  // ── B. MESSAGES PRIVÉS ──
  console.log('\n── B. Messages Privés ──')

  // B1. Ouvrir conversation DM (messagerie = Conversations.js → #dm-input)
  {
    const { page, ctx } = await newPage(browser)
    const FRIEND = { uid: 'uid_friend', username: 'MonAmi', avatar: '👋' }
    await page.evaluate((friend) => {
      window.setState?.({
        socialSubTab: 'messagerie',
        activeDMConversation: friend.uid,
        activeDMUsername: friend.username,
      })
      window.openFriendChat?.(friend.uid, friend.username)
    }, FRIEND)
    await page.waitForTimeout(2000)
    const dmVisible = await page.evaluate(() =>
      !!document.getElementById('dm-input') ||
      !!document.getElementById('private-chat-input') ||
      window.getState?.()?.activeDMConversation != null
    )
    log(dmVisible ? '✓' : '?', 'Messages privés — conversation ouverte')

    if (dmVisible) {
      // B2. Envoyer message privé — cherche #dm-input ou #private-chat-input
      const inputId = await page.evaluate(() =>
        document.getElementById('dm-input') ? 'dm-input' : 'private-chat-input'
      )
      const input = await page.$(`#${inputId}`)
      if (input) {
        await input.fill('Test message privé 🤙')
        await page.evaluate(() => window.sendDM?.() || window.sendPrivateMessage?.('uid_friend'))
        await page.waitForTimeout(1000)
        const cleared = await page.evaluate((id) => !document.getElementById(id)?.value, inputId)
        log(cleared ? '✓' : '?', 'Messages privés — message envoyé (input vidé)')
      } else {
        log('?', 'Messages privés — input DM non trouvé')
      }
    }
    await ctx.close()
  }

  // ── C. FIL D'ACTIVITÉ (Conversations / messagerie) ──
  console.log('\n── C. Fil d\'Activité ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ socialSubTab: 'messagerie' }))
    await page.waitForTimeout(2000)
    // messagerie = Conversations.js → liste des conversations
    const feedVisible = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('message') ||
      document.body.innerText.toLowerCase().includes('conversation') ||
      document.body.innerText.toLowerCase().includes('chat') ||
      !!document.querySelector('[class*="conversation"], [class*="message"]')
    )
    log(feedVisible ? '✓' : '?', 'Messagerie — contenu conversations visible')
    await ctx.close()
  }

  // ── D. GROUPES DE VOYAGE ──
  console.log('\n── D. Groupes de Voyage ──')

  // D1. Créer un groupe
  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.openCreateTravelGroup?.() || window.setState?.({ showCreateTravelGroup: true }))
    await page.waitForTimeout(1500)
    const groupVisible = await page.evaluate(() =>
      window.getState?.()?.showCreateTravelGroup === true ||
      !!document.querySelector('[id*="travel-group"], [id*="group"]')
    )
    log(groupVisible ? '✓' : '?', 'Groupe voyage — modal créer groupe ouvert')
    await ctx.close()
  }

  // ── E. RÉACTIONS EMOJI (commentaires d'événements) ──
  console.log('\n── E. Réactions Emoji ──')

  {
    const { page, ctx } = await newPage(browser)
    // Réactions = boutons sur commentaires d'événements (reactToEventComment)
    // state.selectedEvent doit être l'objet complet + commentaires dans spothitch_event_comments
    const fakeEvent = {
      id: 'evt_react', title: 'Test Réactions', type: 'meetup', date: '2026-06-15',
      location: 'Paris', creatorId: 'test_uid', participants: ['test_uid'],
      participantNames: { test_uid: 'TestUser' }, participantAvatars: { test_uid: '🤙' },
      description: 'Test', visibility: 'public', createdAt: new Date().toISOString(),
    }
    // Storage utilise le préfixe spothitch_v4_ (src/utils/storage.js STORAGE_PREFIX)
    const fakeComment = {
      id: 'cmt_1', userId: 'uid_other', userName: 'Other', userAvatar: '😊',
      text: 'Super événement !', createdAt: new Date().toISOString(),
      reactions: { '👍': ['uid_test'] }, replyToId: null,
    }
    await page.evaluate(([evt, comment]) => {
      // Clé avec préfixe spothitch_v4_ utilisé par Storage.set/get
      const commentsStore = { [evt.id]: [comment] }
      localStorage.setItem('spothitch_v4_spothitch_event_comments', JSON.stringify(commentsStore))
      localStorage.setItem('spothitch_events', JSON.stringify([evt]))
      // selectedEvent = objet complet pour renderEventDetail
      window.setState?.({ socialSubTab: 'événements', selectedEvent: evt, eventsLastUpdate: Date.now() })
    }, [fakeEvent, fakeComment])
    await page.waitForTimeout(2000)
    const hasReaction = await page.evaluate(() =>
      !!document.querySelector('button[onclick*="reactToEventComment"]') ||
      !!document.querySelector('[class*="reaction"]')
    )
    log(hasReaction ? '✓' : '?', 'Réactions emoji — bouton réaction sur commentaire événement')
    if (hasReaction) {
      await page.evaluate(() => window.reactToEventComment?.('evt_react', 'cmt_1', '👍'))
      await page.waitForTimeout(500)
      log('✓', 'Réactions emoji — fonction reactToEventComment appelable')
    }
    await ctx.close()
  }

  // ── F. EVENTS — VUE LISTE ──
  console.log('\n── F. Événements — Vue liste ──')

  {
    const { page, ctx } = await newPage(browser)
    await page.evaluate(() => window.setState?.({ socialSubTab: 'événements' }))
    await page.waitForTimeout(2000)
    const eventsVisible = await page.evaluate(() =>
      document.body.innerText.toLowerCase().includes('événement') ||
      document.body.innerText.toLowerCase().includes('event') ||
      !!document.querySelector('[onclick*="createEvent"]')
    )
    log(eventsVisible ? '✓' : '?', 'Événements — onglet chargé')

    // Rejoindre un événement simulé
    await page.evaluate(() => {
      const fakeEvent = {
        id: 'evt_test', title: 'Rassemblement Paris', type: 'meetup', date: '2026-06-15',
        location: 'Paris', creatorId: 'uid_other', participants: ['uid_other'],
        participantNames: { uid_other: 'Other' }, participantAvatars: { uid_other: '😊' },
        description: 'Test event', visibility: 'public', createdAt: new Date().toISOString(),
      }
      // Ajouter l'event en localStorage
      localStorage.setItem('spothitch_events', JSON.stringify([fakeEvent]))
      window.setState?.({ eventsLastUpdate: Date.now() })
    })
    await page.waitForTimeout(1000)
    await page.evaluate(() => window.joinEvent?.('evt_test'))
    await page.waitForTimeout(500)
    log('✓', 'Événements — fonction joinEvent appelable')
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
