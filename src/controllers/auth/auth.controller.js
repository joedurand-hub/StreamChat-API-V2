import User from "../../models/User.js";
import Wallet from "../../models/Wallet.js";
import jwt from "jsonwebtoken"
import { generateRandomCode } from "../../libs/randomeCodes.js";
import { transporter } from "../../libs/nodemailer.js";
import Code from "../../models/Code.js";


export const signup = async (req, res, next) => {
    try {
        const { userName, password, email } = req.body
        const userNameExist = await User.findOne({ userName })
        if (userNameExist) {
            return res.status(400).json({ message: "El nombre de usuario está en uso." })
        }
        const emailExist = await User.findOne({ email })
        if (emailExist) {
            return res.status(400).json({ message: "El email se encuentra en uso." })
        }
        if (password.length >= 6 && password.length < 16) {
            const user = new User({ userName, password, email })
            user.password = await user.encryptPassword(user.password)
            const userSaved = await user.save()

            const token = jwt.sign({ _id: userSaved._id }, `${process.env.TOKEN_KEY_JWT}`, {
                expiresIn: 1815000000
            })
            const wallet = new Wallet({
                user: userSaved._id
            });
            const walletSaved = await wallet.save();
            userSaved.wallet = walletSaved._id;
            await userSaved.save();

            // await transporter.sendMail({
            //     from: 'joeljuliandurand@gmail.com',
            //     to: `${email}`,
            //     subject: `Hola ${userName}, registro exitoso!`,
            //     text: "Gracias por registrarte. Groob es una plataforma creada por Joel Durand. Ante cualquier duda puedes consultar por este medio.", // plain text body
            //     // html: "<b>Hello world?</b>", // html body
            // });
            res.status(200).json({ token })
        }

    } catch (error) {
        console.log("Error: ", error)
        res.status(500).json(error)
        next(error)
    }
}

export const login = async (req, res, next) => {
    try {
        const { email, userName, password } = req.body
        if (email !== undefined && email.length > 0 && password.length > 0) {
            const user = await User.findOne({ email })
            if (!user) {
                return res.status(400).json({ message: 'Usuario no encontrado.' })
            }
            const passwordFromLogin = await user.validatePassword(password)
            if (!passwordFromLogin) return res.status(400).json({ message: 'Email o contraseña incorrectos' })
            const token = jwt.sign({ _id: user._id }, `${process.env.TOKEN_KEY_JWT}`, {
                expiresIn: 1815000000
            })
            res.status(200).json({ token })
        }

        if (userName !== undefined && userName.length > 0 && password.length > 0) {
            const user = await User.findOne({ userName })
            if (!user) {
                return res.status(400).json({ message: 'Usuario no encontrado.' })
            }
            const passwordFromLogin = await user.validatePassword(password)
            if (!passwordFromLogin) return res.status(400).json('Email o contraseña incorrectos')
            const token = jwt.sign({ _id: user._id }, `${process.env.TOKEN_KEY_JWT}`, {
                expiresIn: 1815000000
            })
            res.status(200).json({ token })
        }
    } catch (error) {
        console.log("error:", error)
        res.status(500).json(error)
        next(error)
    }
}

export const logout = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            throw new Error("No se encontró el usuario");
        }
        await user.save()
    } catch (error) {
        console.log("Error: ", error)
        res.status(500).json(error)
        next(error)
    }
}


export const reset = async (req, res, next) => {
    try {
        const { email, userName } = req.body
        console.log(email, userName)
        if (email !== undefined && email.length > 0) {
            const user = await User.findOne({ email })
            const token = jwt.sign({ _id: user._id }, `${process.env.TOKEN_KEY_JWT}`, {
                expiresIn: 900000
            })
            await transporter.sendMail({
                from: 'joeljuliandurand@gmail.com',
                to: `${user?.email}`,
                subject: `Recuperá tu contraseña.`,
                text: `Hola! Alguien solicitó recuperar la contraseña de ingreso. Si no fuiste vos, ignora este email por favor. Tenés 15 minutos para cambiar la contraseña. Accede desde el siguiente link: https://groob.app/change-password?token=${token}`,
                // html: '<button> <a href=`https://www.groob.app/reset-password/${token}`>Resetear contraseña</a></button>',
            });
            res.json({ success: true })

        }
        if (userName !== undefined && userName.length > 0) {
            const user = await User.findOne({ userName })
            const token = jwt.sign({ _id: user._id }, `${process.env.TOKEN_KEY_JWT}`, {
                expiresIn: 900000
            })
            // const verificationLink = `https://www.groob.app/reset-password/${token}}`
            await transporter.sendMail({
                from: 'joeljuliandurand@gmail.com',
                to: `${user?.email}`,
                subject: `Recuperá tu contraseña.`,
                text: `Tenés 15 minutos para cambiar la contraseña, si el botón no funciona prueba copiar y pegar el siguiente link: https://groob.app/change-password?token=${token}`,
                // html: '<button> <a href=`https://www.groob.app/reset-password/${token}`>Resetear contraseña</a></button>',

            });
            res.json({ "success": true })
        }
    } catch (error) {
        console.log("Error: ", error)
        res.status(500).json(error)
        next(error)
    }
}

export const sendVerificationCode = async (req, res, next) => {
    try {
        const { email } = req.body
        if(!email) {
            res.status(403).json({message: "No has ingresado un email"})
            return 
        } 
        const randomCode = generateRandomCode()
        
        const newCode = new Code({ email, code: randomCode });
        const codeSaved = await newCode.save();
        console.log({codeSaved})
        
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "No se encontró el usuario con ese email" });
          }
        await transporter.sendMail({
            from: 'joeljuliandurand@gmail.com',
            to: `${user?.email}`,
            subject: `Verificación de email.`,
            // text: `Hola! Yo de nuevo. Este es el código solicitado para verificar tu email: ${randomCode}. Tiene una duración de 15 minutos!`,
            html: `
    <html>
      <head>
        <style>
          /* Estilos generales */
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          table {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            padding: 20px;
          }
          h1 {
            color: #4CAF50;
            font-size: 24px;
            margin-bottom: 10px;
          }
          p {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
          }
          .code {
            font-size: 20px;
            font-weight: bold;
            color: #4CAF50;
            margin: 10px 0;
          }
          .footer {
            font-size: 12px;
            color: #777777;
            text-align: center;
            margin-top: 20px;
          }
          
          /* Estilos responsivos */
          @media (max-width: 600px) {
            h1 {
              font-size: 20px;
            }
            p, .footer {
              font-size: 14px;
            }
            table {
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td>
              <h1>¡Verificación de tu email!</h1>
              <p>Hola!</p>
              <p>Este es el código solicitado para verificar tu email:</p>
              <p class="code">${randomCode}</p>
              <p>Este código tiene una duración de 15 minutos.</p>
              <p class="footer">Si no solicitaste este código, ignora este mensaje.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
        });
        res.status(200).json({ message: "Email enviado!" })

    } catch (error) {
        console.error("Error: ", error)
        res.status(500).json(error)
        next(error)
    }
}

export const verifyCode = async (req, res, next) => {
    try {
      const { email, code } = req.body;
      console.log({email, code})
      if (!code) {
        return res.status(400).json({ message: "Código requerido." });
      }
      const codeRecord = await Code.findOne({ email, code });
      if (!codeRecord) {
        return res.status(404).json({ message: "Código incorrecto o no encontrado" });
      }
      const now = new Date();
      const createdAt = codeRecord.createdAt;
      const expirationTime = 15 * 60 * 1000; 
  
      if (now - createdAt > expirationTime) {
  
        await Code.deleteOne({ email, code });
        return res.status(400).json({ message: "El código ha expirado." });
      }
  
      const user = await User.findOne({ email });
      if (user) {
        user.emailVerified = true;
        await user.save();
      }
  
      await Code.deleteOne({ email, code });
      return res.status(200).json({ message: "Código verificado correctamente!" });
  
    } catch (error) {
      console.error("Error en la verificación del código: ", error);
      res.status(500).json({ message: "Hubo un error al verificar el código." });
      next(error);
    }
  };

  
export const changePassword = async (req, res, next) => {
    try {
        const { password } = req.body
        if (!password) {
            return res.status(400).json("No se recibió ninguna contraseña.")
        }
        if (password.length >= 6 && password.length <= 16) {
            const user = await User.findById(req.userId)
            user.password = await user.encryptPassword(password)
            await user.save()
            return res.status(200).json({ "success": true })
        }
    } catch (error) {
        console.log("Error: ", error)
        res.status(500).json(error)
        next(error)
    }
}