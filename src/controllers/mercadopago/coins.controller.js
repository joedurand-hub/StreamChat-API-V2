import { MercadoPagoConfig, Preference } from 'mercadopago';

export const buyCoins = async (req, res, next) => {
  const { price, coinsQuantity, id, monedaDeFrente } = req.body;

  try {
    const parsedPrice = Number(price);
    const parsedCoins = Number(coinsQuantity);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || !Number.isInteger(parsedCoins) || parsedCoins <= 0) {
      return res.status(400).json({ message: "Precio o cantidad de monedas inválidos" });
    }
    if (id?.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "No podés crear un pago para otro usuario" });
    }
    if (!process.env.ACCESS_TOKEN_PROD_MP) {
      return res.status(503).json({ message: "Mercado Pago no está configurado" });
    }
    const client = new MercadoPagoConfig({ accessToken: process.env.ACCESS_TOKEN_PROD_MP });
    const preference = new Preference(client);
    const publicApiUrl = (process.env.PUBLIC_API_URL || 'https://streamchat-api-v2.onrender.com').replace(/\/$/, '');
    const appWebUrl = (process.env.APP_WEB_URL || 'https://groob.app').replace(/\/$/, '');

    const response = await preference.create({
      body: {
        metadata: {
          userBuyer: id,
          coinsQuantity: parsedCoins,
          price: parsedPrice,
        },
        items: [
          {
            title: "Monedas",
            unit_price: parsedPrice,
            quantity: 1,
            description:
              "Las monedas son consumibles para desbloquear contenido, experiencias de streaming, servicios de videollamada y realizar donaciones dentro de la plataforma. Son acumulables y podrás canjearlas por dinero real.",
            currency_id: "ARS",
            picture_url: monedaDeFrente,
          },
        ],
        back_urls: {
          success: `${appWebUrl}/notifications/success`,
          pending: `${appWebUrl}/notifications/pending`,
          failure: `${appWebUrl}/notifications/error`,
        },
        auto_return: "approved",
        notification_url: `${publicApiUrl}/api/notifications`,
      },
    });

    return res.status(200).json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
      body: response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
    next(error);
  }
};
