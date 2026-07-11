import path from 'path'
import fs from 'fs-extra'
import Story from '../../models/Story.js'
import User from '../../models/User.js'

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000

export const removeExpiredStoryFiles = async () => {
  const expired = await Story.find({ expiresAt: { $lte: new Date() } }).select('+filePath')
  await Promise.allSettled(expired.map(story => fs.remove(story.filePath)))
  if (expired.length) await Story.deleteMany({ _id: { $in: expired.map(story => story._id) } })
  const uploadDirectory = path.resolve('uploads')
  const files = await fs.readdir(uploadDirectory).catch(() => [])
  const now = Date.now()
  await Promise.allSettled(files.filter(name => name.startsWith('story-')).map(async name => {
    const filePath = path.join(uploadDirectory, name)
    const stat = await fs.stat(filePath)
    if (now - stat.mtimeMs >= STORY_LIFETIME_MS) await fs.remove(filePath)
  }))
}

export const createStory = async (req, res) => {
  const file = req.files?.story?.[0]
  if (!file) return res.status(400).json({ message: 'La historia necesita una foto o video.' })
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' })
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image'
    const mediaUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(file.path)}`
    const story = await Story.create({
      user: user._id,
      userName: user.userName,
      profilePicture: user.profilePicture?.secure_url,
      mediaUrl,
      filePath: file.path,
      mediaType,
      expiresAt: new Date(Date.now() + STORY_LIFETIME_MS),
    })
    return res.status(201).json({ story })
  } catch (error) {
    await fs.remove(file.path)
    throw error
  }
}

export const getStories = async (req, res) => {
  await removeExpiredStoryFiles()
  const user = await User.findById(req.userId).select('followings')
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' })
  const allowedUsers = [...user.followings, req.userId.toString()]
  const stories = await Story.find({ user: { $in: allowedUsers }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 })
  return res.status(200).json(stories)
}

export const denounceStory = async (req, res) => {
  const story = await Story.findOneAndUpdate(
    { _id: req.params.id, expiresAt: { $gt: new Date() } },
    { $addToSet: { denouncements: req.userId.toString() } },
    { new: true }
  )
  if (!story) return res.status(404).json({ message: 'Historia no encontrada.' })
  return res.status(200).json({ message: 'Historia denunciada.' })
}

export const deleteStory = async (req, res) => {
  const story = await Story.findOne({ _id: req.params.id, user: req.userId }).select('+filePath')
  if (!story) return res.status(404).json({ message: 'Historia no encontrada.' })
  await Promise.allSettled([fs.remove(story.filePath), Story.deleteOne({ _id: story._id })])
  return res.status(200).json({ message: 'Historia eliminada.' })
}
