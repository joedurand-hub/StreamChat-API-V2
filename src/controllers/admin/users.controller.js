import User from '../../models/User.js'
import Publication from '../../models/Publication.js'

export const getAllUsers = async (req, res, next) => {
    try {
        const data = await User.find({})
        res.status(200).json(data)

    } catch (error) {
        console.log("Cannot get profile", error)
        res.status(404).json(error)
        next(error)
    }
}
