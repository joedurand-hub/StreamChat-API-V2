import { MercadoPagoConfig, Preference } from 'mercadopago';

// Crear cliente con tu token
const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN_PROD_MP,
});

export const buyCoins = async (req, res, next) => {
  const { price, coinsQuantity, id, monedaDeFrente } = req.body;
  console.log({ price, coinsQuantity, id, monedaDeFrente });

  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        metadata: {
          userBuyer: id,
          coinsQuantity: parseInt(coinsQuantity),
          price: parseInt(price),
        },
        items: [
          {
            title: "Monedas",
            unit_price: parseInt(price),
            quantity: 1,
            description:
              "Las monedas son consumibles para desbloquear contenido, experiencias de streaming, servicios de videollamada y realizar donaciones dentro de la plataforma. Son acumulables y podrás canjearlas por dinero real.",
            currency_id: "ARS",
            picture_url: monedaDeFrente,
          },
        ],
        back_urls: {
          success: "https://groob.app/notifications/success",
          pending: "https://groob.app/notifications/pending",
          failure: "https://groob.app/notifications/error",
        },
        auto_return: "approved",
        notification_url: "https://groob.onrender.com/notifications",
      },
    });

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
    next(error);
  }
};
