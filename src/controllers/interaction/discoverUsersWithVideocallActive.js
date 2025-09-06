import User from '../../models/User.js'

export const discoverUsersWithVideocallActive = async (req, res, next) => {
    // traer mi perfil
    // traer mi wallet
    try {
        if(!req.userId) return res.status(401).json("No has iniciado sesión o no se encontró tu usuario")
        const myUserId = req.userId.toString()
        const allProfiles = await User.find({}, {
            password: 0,
            followers: 0,
            notifications: 0,
            firstName: 0,
            lastName: 0,
            createdAt: 0,
            updatedAt: 0,
            publications: 0,
            email: 0,
        })
        const filterProfileForVideocallActive = allProfiles.filter((profile, index) => {
            return profile.receiveVideocall
        }) 
        res.status(200).json({filterProfileForVideocallActive, myUserId})
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener perfiles aleatorios' });
        next(error);
    }
}