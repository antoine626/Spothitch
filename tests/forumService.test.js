/**
 * Tests for Forum Service
 * Feature #202 - Forum/Discussions Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock dependencies
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    lang: 'fr',
    user: { uid: 'user-123', isModerator: false, isAdmin: false },
    username: 'TestUser',
    avatar: '🤙',
  })),
  setState: vi.fn(),
}))

vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn(() => null),
    set: vi.fn(),
  },
}))

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => key),
}))

// Import service after mocks
import {
  ForumCategories,
  TopicStatus,
  PostStatus,
  ReportReasons,
  getForumCategories,
  getCategory,
  getCategoryTopics,
  getTopic,
  createTopic,
  replyToTopic,
  editPost,
  deletePost,
  deleteTopic,
  pinTopic,
  unpinTopic,
  lockTopic,
  unlockTopic,
  likeTopic,
  likePost,
  reportPost,
  searchForum,
  getPopularTopics,
  getRecentTopics,
  getUserPosts,
  getUserTopics,
  subscribeToTopic,
  unsubscribeFromTopic,
  getSubscribedTopics,
  getForumStats,
  renderForumCategory,
  renderTopicList,
  renderTopicDetail,
  renderPostEditor,
  clearForumData,
  incrementTopicViewCount,
} from '../src/services/forumService.js'

import { getState, setState } from '../src/stores/state.js'
import { Storage } from '../src/utils/storage.js'
import { showToast } from '../src/services/notifications.js'

describe('ForumService - Constants', () => {
  it('should have 5 forum categories', () => {
    expect(Object.keys(ForumCategories)).toHaveLength(5)
    expect(ForumCategories).toHaveProperty('general')
    expect(ForumCategories).toHaveProperty('tips')
    expect(ForumCategories).toHaveProperty('routes')
    expect(ForumCategories).toHaveProperty('meetups')
    expect(ForumCategories).toHaveProperty('help')
  })

  it('should have topic status values', () => {
    expect(TopicStatus.OPEN).toBe('open')
    expect(TopicStatus.LOCKED).toBe('locked')
    expect(TopicStatus.PINNED).toBe('pinned')
    expect(TopicStatus.DELETED).toBe('deleted')
  })

  it('should have post status values', () => {
    expect(PostStatus.ACTIVE).toBe('active')
    expect(PostStatus.EDITED).toBe('edited')
    expect(PostStatus.DELETED).toBe('deleted')
    expect(PostStatus.REPORTED).toBe('reported')
  })

  it('should have report reasons', () => {
    expect(ReportReasons).toHaveProperty('spam')
    expect(ReportReasons).toHaveProperty('inappropriate')
    expect(ReportReasons).toHaveProperty('harassment')
    expect(ReportReasons).toHaveProperty('misinformation')
    expect(ReportReasons).toHaveProperty('other')
  })
})

describe('ForumService - Category Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should get all forum categories', () => {
    const categories = getForumCategories()
    expect(categories).toHaveLength(5)
    expect(categories[0]).toHaveProperty('id')
    expect(categories[0]).toHaveProperty('emoji')
    expect(categories[0]).toHaveProperty('name')
    expect(categories[0]).toHaveProperty('description')
    expect(categories[0]).toHaveProperty('topicCount')
    expect(categories[0]).toHaveProperty('postCount')
  })

  it('should get a single category by ID', () => {
    const category = getCategory('general')
    expect(category).toBeTruthy()
    expect(category.id).toBe('general')
    expect(category.emoji).toBe('💬')
    expect(category.name).toBeTruthy()
    expect(category.description).toBeTruthy()
  })

  it('should return null for invalid category ID', () => {
    const category = getCategory('invalid')
    expect(category).toBeNull()
  })

  it('should include stats in categories', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Test',
          content: 'Test content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Reply',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const categories = getForumCategories()
    const general = categories.find(c => c.id === 'general')
    expect(general.topicCount).toBe(1)
    expect(general.postCount).toBe(1)
  })
})

describe('ForumService - Topic Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should get topics in a category with pagination', () => {
    const topics = Array.from({ length: 25 }, (_, i) => ({
      id: `topic-${i}`,
      categoryId: 'general',
      title: `Topic ${i}`,
      content: 'Content',
      author: { id: 'user-1', username: 'User1', avatar: '🤙' },
      status: TopicStatus.OPEN,
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 1000).toISOString(),
    }))

    Storage.get.mockReturnValue({
      topics,
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = getCategoryTopics('general', 1, 20)
    expect(result.topics).toHaveLength(20)
    expect(result.total).toBe(25)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(2)
  })

  it('should return empty array for invalid category', () => {
    const result = getCategoryTopics('invalid')
    expect(result.topics).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('should sort pinned topics first', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Regular Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date(Date.now() - 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1000).toISOString(),
        },
        {
          id: 'topic-2',
          categoryId: 'general',
          title: 'Pinned Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.PINNED,
          createdAt: new Date(Date.now() - 2000).toISOString(),
          updatedAt: new Date(Date.now() - 2000).toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = getCategoryTopics('general')
    expect(result.topics[0].id).toBe('topic-2')
    expect(result.topics[0].isPinned).toBe(true)
  })

  it('should get a single topic with replies', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Test Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Reply 1',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const topic = getTopic('topic-1')
    expect(topic).toBeTruthy()
    expect(topic.id).toBe('topic-1')
    expect(topic.replies).toHaveLength(1)
    expect(topic.replyCount).toBe(1)
    expect(topic.category).toBeTruthy()
  })

  it('should return null for non-existent topic', () => {
    const topic = getTopic('invalid')
    expect(topic).toBeNull()
  })

  it('should return null for deleted topic', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Deleted Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.DELETED,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const topic = getTopic('topic-1')
    expect(topic).toBeNull()
  })

  it('should create a new topic', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = createTopic('general', 'Test Topic', 'This is a test topic content.')
    expect(result.success).toBe(true)
    expect(result.topic).toBeTruthy()
    expect(result.topic.title).toBe('Test Topic')
    expect(result.topic.content).toBe('This is a test topic content.')
    expect(result.topic.categoryId).toBe('general')
    expect(result.topic.status).toBe(TopicStatus.OPEN)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should fail to create topic with invalid category', () => {
    const result = createTopic('invalid', 'Test', 'Content here.')
    expect(result.success).toBe(false)
    expect(result.error).toBe('invalid_category')
  })

  it('should fail to create topic with short title', () => {
    const result = createTopic('general', 'AB', 'Content here.')
    expect(result.success).toBe(false)
    expect(result.error).toBe('title_too_short')
  })

  it('should fail to create topic with short content', () => {
    const result = createTopic('general', 'Valid Title', 'Short')
    expect(result.success).toBe(false)
    expect(result.error).toBe('content_too_short')
  })

  it('should delete a topic (soft delete)', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic to delete',
          content: 'Content',
          author: { id: 'user-123', username: 'TestUser', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = deleteTopic('topic-1')
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
  })

  it('should fail to delete non-existent topic', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = deleteTopic('invalid')
    expect(result.success).toBe(false)
    expect(result.error).toBe('topic_not_found')
  })

  it('should fail to delete topic if not author or moderator', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'other-user', username: 'Other', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = deleteTopic('topic-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('not_authorized')
  })
})

describe('ForumService - Post Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should reply to a topic', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Test Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = replyToTopic('topic-1', 'This is my reply')
    expect(result.success).toBe(true)
    expect(result.post).toBeTruthy()
    expect(result.post.content).toBe('This is my reply')
    expect(result.post.topicId).toBe('topic-1')
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should fail to reply to non-existent topic', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = replyToTopic('invalid', 'Reply')
    expect(result.success).toBe(false)
    expect(result.error).toBe('topic_not_found')
  })

  it('should fail to reply to locked topic', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Locked Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.LOCKED,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = replyToTopic('topic-1', 'Cannot reply')
    expect(result.success).toBe(false)
    expect(result.error).toBe('topic_locked')
  })

  it('should fail to reply with short content', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = replyToTopic('topic-1', 'AB')
    expect(result.success).toBe(false)
    expect(result.error).toBe('content_too_short')
  })

  it('should edit a post', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Original content',
          author: { id: 'user-123', username: 'TestUser', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = editPost('post-1', 'Updated content')
    expect(result.success).toBe(true)
    expect(result.post.content).toBe('Updated content')
    expect(result.post.status).toBe(PostStatus.EDITED)
    expect(result.post.editedAt).toBeTruthy()
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should fail to edit non-existent post', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = editPost('invalid', 'New content')
    expect(result.success).toBe(false)
    expect(result.error).toBe('post_not_found')
  })

  it('should fail to edit post if not author or moderator', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Content',
          author: { id: 'other-user', username: 'Other', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = editPost('post-1', 'New content')
    expect(result.success).toBe(false)
    expect(result.error).toBe('not_authorized')
  })

  it('should delete a post (soft delete)', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Content to delete',
          author: { id: 'user-123', username: 'TestUser', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = deletePost('post-1')
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })
})

describe('ForumService - Moderation Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
    getState.mockReturnValue({
      lang: 'fr',
      user: { uid: 'mod-123', isModerator: true, isAdmin: false },
      username: 'Moderator',
      avatar: '🛡️',
    })
  })

  it('should pin a topic', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic to pin',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = pinTopic('topic-1')
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should fail to pin topic if not moderator', () => {
    getState.mockReturnValue({
      lang: 'fr',
      user: { uid: 'user-123', isModerator: false, isAdmin: false },
      username: 'TestUser',
      avatar: '🤙',
    })

    const result = pinTopic('topic-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('not_authorized')
  })

  it('should unpin a topic', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Pinned Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.PINNED,
          createdAt: new Date().toISOString(),
          pinnedAt: new Date().toISOString(),
          pinnedBy: 'mod-123',
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = unpinTopic('topic-1')
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should lock a topic', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic to lock',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = lockTopic('topic-1')
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should unlock a topic', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Locked Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.LOCKED,
          createdAt: new Date().toISOString(),
          lockedAt: new Date().toISOString(),
          lockedBy: 'mod-123',
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = unlockTopic('topic-1')
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })
})

describe('ForumService - Like Functions', () => {
  let mockStorage = {}

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage = {
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }
    Storage.get.mockImplementation(() => JSON.parse(JSON.stringify(mockStorage)))
    Storage.set.mockImplementation((key, data) => {
      mockStorage = JSON.parse(JSON.stringify(data))
    })
  })

  it('should like a topic', () => {
    mockStorage = {
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    const result = likeTopic('topic-1')
    expect(result.success).toBe(true)
    expect(result.liked).toBe(true)
    expect(result.likeCount).toBe(1)
    expect(Storage.set).toHaveBeenCalled()
  })

  it('should unlike a topic', () => {
    mockStorage = {
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    // First call to like
    const result1 = likeTopic('topic-1')
    expect(result1.success).toBe(true)
    expect(result1.liked).toBe(true)
    expect(result1.likeCount).toBe(1)

    // Second call to unlike
    const result2 = likeTopic('topic-1')
    expect(result2.success).toBe(true)
    expect(result2.liked).toBe(false)
    expect(result2.likeCount).toBe(0)
    expect(Storage.set).toHaveBeenCalled()
  })

  it('should like a post', () => {
    mockStorage = {
      topics: [],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Post content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    const result = likePost('post-1')
    expect(result.success).toBe(true)
    expect(result.liked).toBe(true)
    expect(result.likeCount).toBe(1)
    expect(Storage.set).toHaveBeenCalled()
  })

  it('should fail to like deleted topic', () => {
    mockStorage = {
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.DELETED,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    const result = likeTopic('topic-1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('topic_not_found')
  })
})

describe('ForumService - Report Function', () => {
  let mockStorage = {}

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage = {
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }
    Storage.get.mockImplementation(() => JSON.parse(JSON.stringify(mockStorage)))
    Storage.set.mockImplementation((key, data) => {
      mockStorage = JSON.parse(JSON.stringify(data))
    })
  })

  it('should report a post', () => {
    mockStorage = {
      topics: [],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Inappropriate content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    const result = reportPost('post-1', 'spam', 'This is spam')
    expect(result.success).toBe(true)
    expect(result.report).toBeTruthy()
    expect(result.report.reason).toBe('spam')
    expect(result.report.details).toBe('This is spam')
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should fail to report with invalid reason', () => {
    mockStorage = {
      topics: [],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    const result = reportPost('post-1', 'invalid_reason', 'Details')
    expect(result.success).toBe(false)
    expect(result.error).toBe('invalid_reason')
  })

  it('should fail to report already reported post', () => {
    mockStorage = {
      topics: [],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    // First report succeeds
    const result1 = reportPost('post-1', 'spam', 'This is spam')
    expect(result1.success).toBe(true)

    // Second report fails
    const result2 = reportPost('post-1', 'spam', 'Already reported')
    expect(result2.success).toBe(false)
    expect(result2.error).toBe('already_reported')
  })
})

describe('ForumService - Search Function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should search forum topics and posts', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Hitchhiking tips',
          content: 'Great advice',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'topic-2',
          categoryId: 'routes',
          title: 'Best routes',
          content: 'Amazing routes',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'I love hitchhiking',
          author: { id: 'user-3', username: 'User3', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = searchForum('hitchhiking')
    expect(result.total).toBeGreaterThan(0)
    expect(result.query).toBe('hitchhiking')
    expect(result.topics.length + result.posts.length).toBeGreaterThan(0)
  })

  it('should return empty results for short query', () => {
    const result = searchForum('h')
    expect(result.topics).toHaveLength(0)
    expect(result.posts).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('should filter search by category', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Test Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'topic-2',
          categoryId: 'routes',
          title: 'Test Routes',
          content: 'Content',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = searchForum('test', { categoryId: 'general' })
    expect(result.topics).toHaveLength(1)
    expect(result.topics[0].categoryId).toBe('general')
  })

  it('should limit search results', () => {
    const topics = Array.from({ length: 30 }, (_, i) => ({
      id: `topic-${i}`,
      categoryId: 'general',
      title: `Test Topic ${i}`,
      content: 'Content',
      author: { id: 'user-1', username: 'User1', avatar: '🤙' },
      status: TopicStatus.OPEN,
      createdAt: new Date().toISOString(),
    }))

    Storage.get.mockReturnValue({
      topics,
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = searchForum('test', { limit: 10 })
    expect(result.topics.length).toBeLessThanOrEqual(10)
  })
})

describe('ForumService - Popular & Recent Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should get popular topics', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Popular Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
          viewCount: 100,
        },
        {
          id: 'topic-2',
          categoryId: 'tips',
          title: 'Less Popular',
          content: 'Content',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
          viewCount: 10,
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: { 'topic-1': ['user-1', 'user-2', 'user-3'] }, posts: {} },
    })

    const topics = getPopularTopics(10)
    expect(topics).toHaveLength(2)
    expect(topics[0].id).toBe('topic-1')
    expect(topics[0].score).toBeGreaterThan(topics[1].score)
  })

  it('should get recent topics', () => {
    const now = Date.now()
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Old Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date(now - 10000).toISOString(),
        },
        {
          id: 'topic-2',
          categoryId: 'tips',
          title: 'New Topic',
          content: 'Content',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date(now).toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const topics = getRecentTopics(10)
    expect(topics).toHaveLength(2)
    expect(topics[0].id).toBe('topic-2')
  })

  it('should limit popular topics', () => {
    const topics = Array.from({ length: 20 }, (_, i) => ({
      id: `topic-${i}`,
      categoryId: 'general',
      title: `Topic ${i}`,
      content: 'Content',
      author: { id: 'user-1', username: 'User1', avatar: '🤙' },
      status: TopicStatus.OPEN,
      createdAt: new Date().toISOString(),
      viewCount: i,
    }))

    Storage.get.mockReturnValue({
      topics,
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const result = getPopularTopics(5)
    expect(result).toHaveLength(5)
  })
})

describe('ForumService - User Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should get posts by a user', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Post by user',
          author: { id: 'user-123', username: 'TestUser', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'post-2',
          topicId: 'topic-1',
          content: 'Post by other',
          author: { id: 'user-456', username: 'Other', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const posts = getUserPosts('user-123')
    expect(posts).toHaveLength(1)
    expect(posts[0].author.id).toBe('user-123')
    expect(posts[0].topic).toBeTruthy()
  })

  it('should get topics created by a user', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic by user',
          content: 'Content',
          author: { id: 'user-123', username: 'TestUser', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'topic-2',
          categoryId: 'tips',
          title: 'Topic by other',
          content: 'Content',
          author: { id: 'user-456', username: 'Other', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const topics = getUserTopics('user-123')
    expect(topics).toHaveLength(1)
    expect(topics[0].author.id).toBe('user-123')
    expect(topics[0].category).toBeTruthy()
  })

  it('should return empty array for invalid user ID', () => {
    const posts = getUserPosts('')
    expect(posts).toHaveLength(0)

    const topics = getUserTopics(null)
    expect(topics).toHaveLength(0)
  })
})

describe('ForumService - Subscription Functions', () => {
  let mockStorage = {}

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage = {
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }
    Storage.get.mockImplementation(() => JSON.parse(JSON.stringify(mockStorage)))
    Storage.set.mockImplementation((key, data) => {
      mockStorage = JSON.parse(JSON.stringify(data))
    })
  })

  it('should subscribe to a topic', () => {
    mockStorage = {
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    const result = subscribeToTopic('topic-1')
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should fail to subscribe to non-existent topic', () => {
    mockStorage = {
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    const result = subscribeToTopic('invalid')
    expect(result.success).toBe(false)
    expect(result.error).toBe('topic_not_found')
  })

  it('should fail to subscribe if already subscribed', () => {
    mockStorage = {
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    // First subscription succeeds
    const result1 = subscribeToTopic('topic-1')
    expect(result1.success).toBe(true)

    // Second subscription fails
    const result2 = subscribeToTopic('topic-1')
    expect(result2.success).toBe(false)
    expect(result2.error).toBe('already_subscribed')
  })

  it('should unsubscribe from a topic', () => {
    mockStorage = {
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    // First subscribe
    const result1 = subscribeToTopic('topic-1')
    expect(result1.success).toBe(true)

    // Then unsubscribe
    const result2 = unsubscribeFromTopic('topic-1')
    expect(result2.success).toBe(true)
    expect(Storage.set).toHaveBeenCalled()
    expect(showToast).toHaveBeenCalled()
  })

  it('should get subscribed topics', () => {
    mockStorage = {
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic 1',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'topic-2',
          categoryId: 'tips',
          title: 'Topic 2',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    // Subscribe to two topics
    subscribeToTopic('topic-1')
    subscribeToTopic('topic-2')

    const topics = getSubscribedTopics()
    expect(topics).toHaveLength(2)
    expect(topics).toContain('topic-1')
    expect(topics).toContain('topic-2')
  })
})

describe('ForumService - Statistics Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should get forum statistics', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic 1',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'topic-2',
          categoryId: 'tips',
          title: 'Topic 2',
          content: 'Content',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          status: TopicStatus.DELETED,
          createdAt: new Date().toISOString(),
        },
      ],
      posts: [
        {
          id: 'post-1',
          topicId: 'topic-1',
          content: 'Post',
          author: { id: 'user-3', username: 'User3', avatar: '🤙' },
          status: PostStatus.ACTIVE,
          createdAt: new Date().toISOString(),
        },
      ],
      subscriptions: [],
      reports: [
        { id: 'report-1', postId: 'post-1', status: 'pending', reportedAt: new Date().toISOString() },
      ],
      likes: { topics: { 'topic-1': ['user-1', 'user-2'] }, posts: { 'post-1': ['user-3'] } },
    })

    const stats = getForumStats()
    expect(stats.totalTopics).toBe(1)
    expect(stats.totalPosts).toBe(1)
    expect(stats.totalAuthors).toBeGreaterThan(0)
    expect(stats.totalLikes).toBe(3)
    expect(stats.pendingReports).toBe(1)
    expect(stats.categoriesCount).toBe(5)
  })
})

describe('ForumService - Render Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should render a forum category', () => {
    const category = {
      id: 'general',
      emoji: '💬',
      name: 'Discussion generale',
      description: 'Parlez de tout',
      topicCount: 10,
      postCount: 50,
    }

    const html = renderForumCategory(category)
    expect(html).toContain('💬')
    expect(html).toContain('Discussion generale')
    expect(html).toContain('10')
    expect(html).toContain('50')
    expect(html).toContain('data-category-id="general"')
  })

  it('should render topic list', () => {
    const topics = [
      {
        id: 'topic-1',
        title: 'Test Topic',
        author: { id: 'user-1', username: 'User1', avatar: '🤙' },
        createdAt: new Date().toISOString(),
        replyCount: 5,
        likeCount: 3,
        isPinned: false,
        isLocked: false,
      },
    ]

    const html = renderTopicList(topics)
    expect(html).toContain('Test Topic')
    expect(html).toContain('User1')
    expect(html).toContain('5')
    expect(html).toContain('3')
    expect(html).toContain('data-topic-id="topic-1"')
  })

  it('should render empty state for no topics', () => {
    const html = renderTopicList([])
    expect(html).toContain('empty-state')
    expect(html).toContain('💬')
  })

  it('should render topic detail', () => {
    const topic = {
      id: 'topic-1',
      title: 'Test Topic',
      content: 'This is the content',
      author: { id: 'user-1', username: 'User1', avatar: '🤙' },
      createdAt: new Date().toISOString(),
      replies: [
        {
          id: 'post-1',
          content: 'First reply',
          author: { id: 'user-2', username: 'User2', avatar: '🤙' },
          createdAt: new Date().toISOString(),
          status: PostStatus.ACTIVE,
          likeCount: 1,
          isLikedByUser: false,
        },
      ],
      replyCount: 1,
      likeCount: 2,
      isLikedByUser: false,
      isSubscribed: false,
      isPinned: false,
      isLocked: false,
      category: { id: 'general', emoji: '💬', name: 'General' },
    }

    const html = renderTopicDetail(topic)
    expect(html).toContain('Test Topic')
    expect(html).toContain('This is the content')
    expect(html).toContain('First reply')
    expect(html).toContain('User1')
    expect(html).toContain('User2')
  })

  it('should render post editor', () => {
    const html = renderPostEditor({ mode: 'create' })
    expect(html).toContain('post-editor')
    expect(html).toContain('topic-editor-form')
    expect(html).toContain('categoryId')
    expect(html).toContain('title')
    expect(html).toContain('content')
  })

  it('should render post editor in edit mode', () => {
    const html = renderPostEditor({
      mode: 'edit',
      topicId: 'topic-1',
      title: 'Existing Title',
      content: 'Existing content',
      categoryId: 'general',
    })
    expect(html).toContain('Existing Title')
    expect(html).toContain('Existing content')
    expect(html).toContain('value="general"')
  })
})

describe('ForumService - Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should clear all forum data', () => {
    const result = clearForumData()
    expect(result.success).toBe(true)
    expect(Storage.set).toHaveBeenCalledWith('spothitch_forum', {
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })
  })

  it('should increment topic view count', () => {
    Storage.get.mockReturnValue({
      topics: [
        {
          id: 'topic-1',
          categoryId: 'general',
          title: 'Topic',
          content: 'Content',
          author: { id: 'user-1', username: 'User1', avatar: '🤙' },
          status: TopicStatus.OPEN,
          createdAt: new Date().toISOString(),
          viewCount: 5,
        },
      ],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    incrementTopicViewCount('topic-1')
    expect(Storage.set).toHaveBeenCalled()
  })

  it('should handle increment view for non-existent topic', () => {
    Storage.get.mockReturnValue({
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    incrementTopicViewCount('invalid')
    expect(Storage.set).not.toHaveBeenCalled()
  })
})

describe('ForumService - Global Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
  })

  it('should have global window handlers', () => {
    expect(typeof window.openForumCategory).toBe('function')
    expect(typeof window.openForumTopic).toBe('function')
    expect(typeof window.openCreateTopic).toBe('function')
    expect(typeof window.goBackToForum).toBe('function')
    expect(typeof window.likeForumTopic).toBe('function')
    expect(typeof window.likeForumPost).toBe('function')
    expect(typeof window.subscribeToForumTopic).toBe('function')
    expect(typeof window.unsubscribeFromForumTopic).toBe('function')
    expect(typeof window.submitForumReply).toBe('function')
    expect(typeof window.editForumPost).toBe('function')
    expect(typeof window.deleteForumPost).toBe('function')
    expect(typeof window.reportForumPost).toBe('function')
    expect(typeof window.closeForumEditor).toBe('function')
    expect(typeof window.submitForumTopic).toBe('function')
    expect(typeof window.editForumTopic).toBe('function')
  })
})

describe('ForumService - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearForumData()
  })

  it('should handle complete topic creation and reply workflow', () => {
    let mockData = {
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    Storage.get.mockReturnValue(mockData)
    Storage.set.mockImplementation((key, data) => {
      mockData = data
      Storage.get.mockReturnValue(data)
    })

    // Create topic
    const createResult = createTopic('general', 'Integration Test', 'This is a test topic content.')
    expect(createResult.success).toBe(true)

    const topicId = createResult.topic.id

    // Reply to topic
    const replyResult = replyToTopic(topicId, 'This is a test reply')
    expect(replyResult.success).toBe(true)

    // Get topic with replies
    const topic = getTopic(topicId)
    expect(topic.replies).toHaveLength(1)
    expect(topic.replyCount).toBe(1)
  })

  it('should handle like and unlike workflow', () => {
    let mockData = {
      topics: [],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    }

    Storage.get.mockReturnValue(mockData)
    Storage.set.mockImplementation((key, data) => {
      mockData = data
      Storage.get.mockReturnValue(data)
    })

    const createResult = createTopic('general', 'Like Test', 'Content for like test.')
    expect(createResult.success).toBe(true)

    const topicId = createResult.topic.id

    // Like
    const likeResult1 = likeTopic(topicId)
    expect(likeResult1.success).toBe(true)
    expect(likeResult1.liked).toBe(true)
    expect(likeResult1.likeCount).toBe(1)

    // Unlike
    const likeResult2 = likeTopic(topicId)
    expect(likeResult2.success).toBe(true)
    expect(likeResult2.liked).toBe(false)
    expect(likeResult2.likeCount).toBe(0)
  })

  it('should handle moderation workflow', () => {
    getState.mockReturnValue({
      lang: 'fr',
      user: { uid: 'mod-123', isModerator: true, isAdmin: false },
      username: 'Moderator',
      avatar: '🛡️',
    })

    const createResult = createTopic('general', 'Moderation Test', 'Topic to moderate.')
    expect(createResult.success).toBe(true)

    const topicId = createResult.topic.id

    Storage.get.mockReturnValue({
      topics: [createResult.topic],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    // Pin
    const pinResult = pinTopic(topicId)
    expect(pinResult.success).toBe(true)

    // Lock
    Storage.get.mockReturnValue({
      topics: [{ ...createResult.topic, status: TopicStatus.PINNED }],
      posts: [],
      subscriptions: [],
      reports: [],
      likes: { topics: {}, posts: {} },
    })

    const lockResult = lockTopic(topicId)
    expect(lockResult.success).toBe(true)
  })
})
