const fs = require('fs');
const formData = require('urlencoded-body-parser');
const { promisify } = require('util');
const {
    Address,
    CreditCardData,
    ServicesConfig,
    ServicesContainer,
    MobilePaymentMethodType,
    PaymentDataSourceType
} = require('globalpayments-api');

const readFileAsync = promisify(fs.readFile);

const showIndex = async (res) => {
    const html = await readFileAsync('index.html');
    res.end(html);
};

const showSuccess = async (res) => {
    const html = await readFileAsync('success.html');
    res.end(html);
};

const showError = async (res) => {
    const html = await readFileAsync('error.html');
    res.end(html);
};

const configure = () => {
    const config = new ServicesConfig();
    config.secretApiKey = 'skapi_cert_MTu8BQCpqHAAInro-claA-DdI5-LPaRjUToSar8yxg';
    config.serviceUrl = 'https://cert.api2-c.heartlandportico.com';

    // The following variables will be provided to your during certification.
    config.versionNumber = '0000';
    config.developerId = '000000';

    ServicesContainer.configure(config);
}

module.exports = async (req, res) => {
    switch (req.method) {
        case 'GET':
            if (req.url.indexOf('/success') === 0) {
                await showSuccess(res);
                return;
            }
            if (req.url.indexOf('/error') === 0) {
                await showError(res);
                return;
            }

            await showIndex(res);
            break;
        case 'POST':
            // obtain request data
            const data = await formData(req);

            // create payment request with gateway
            configure();

            const tokenAsObj = JSON.parse(data.paymentReference);

            const card = new CreditCardData();
            card.token = JSON.stringify(tokenAsObj);
            card.mobileType = MobilePaymentMethodType.GOOGLEPAY;
            card.paymentSource = PaymentDataSourceType.GOOGLEPAYWEB;

            const address = new Address();
            address.postalCode = data.postalCode;

            try {
                const payment = await card.charge('100.01')
                    .withCurrency('USD')
                    .withAddress(address)
                    .withAllowDuplicates(true)
                    .execute();

                console.log(`Transaction ID:   ${payment.transactionId}`);
                console.log(`Response Code:    ${payment.responseCode}`);
                console.log(`Response Message: ${payment.responseMessage}`);

                if (payment.responseCode !== '00') {
                    res.writeHead(302, {
                        'Location': '/error',
                    });
                    res.end();
                    return;
                }

                res.writeHead(302, {
                    'Location': '/success',
                });
                res.end();
            } catch (e) {
                console.log(e);
                res.writeHead(302, {
                    'Location': '/error',
                });
                res.end();
            }
            break;
        default:
            res.end();
    }
};