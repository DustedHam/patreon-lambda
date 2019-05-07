const AWS = require("aws-sdk");
const crypto = require('crypto');

AWS.config.update({ region: process.env.REGION });

const documentClient = new AWS.DynamoDB.DocumentClient();

exports.myHandler = async function(event, context, callback)
{
    if (!verifyPatreonHook(event))
    {
        // Unauthorized 
        return {
            statusCode: 401,
        }
    }

    const body = event.body;
    const patreonEvent = event.headers['x-patreon-event'];

    const patron = getPatronData(body);
    if (!patron)
    {
        // Bad request
        // this ~should~ never happen
        return {
            statusCode: 400,
        }
    }

    try
    {
        const result = await handlePatreonEvent(patron, patreonEvent);

        return {
            statusCode: 200,
            body: "OK"
        }
    }
    catch (error)
    {
        // dynamo DB request error;
        console.log(error);
        return {
            statusCode: 400,
            body: JSON.stringify(error)
        }
    }
}

function verifyPatreonHook(event)
{
    var digest = crypto.createHmac('md5', process.env.PATREON_SECRET)
        .update(event.body)
        .digest('hex');
    return digest === event.headers['x-patreon-signature'];
}

async function handlePatreonEvent(patron, event)
{
    switch (patreonEvent)
    {
        case "pledges:create":
            await pledgeCreate(patron)

            break;
        case "pledges:delete":
            await pledgeDelete(patron);

            break;
    }
}

function pledgeCreate(patron)
{
    return new Promise(function(resolve, reject)
    {
        const params = {
            Item:
            {
                "id": patron.id,
                "vanity": patron.attributes.vanity
            },
            TableName: process.env.TABLE_NAME
        }

        documentClient.put(params, function(err, data)
        {
            if (err)
            {
                reject(err);
            }
            resolve(data);
        });
    });
}

function pledgeDelete(patron)
{
    return new Promise(function(resolve, reject)
    {
        const params = {
            Key:
            {
                "id": patron.id,
            },
            TableName: process.env.TABLE_NAME
        }

        documentClient.delete(params, function(err, data)
        {
            if (err)
            {
                reject(err);
            }
            resolve(data);
        });
    });
}

function getPatronData(body)
{
    let patron = body.data.relationships.patron;
    if (!patron)
    {
        // This ~should~ never happen.
        console.error("No Body Data?!", body);
        return;
    }

    for (let i = 0; i < body.included.length; i++)
    {
        let includedData = body.included[i];
        if (patron.data.id == includedData.id)
        {
            return includedData;
        }
    }

    // This ~should~ never happen.
    console.error("Missing Patron Data?!", body);
    return;
}