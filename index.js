const AWS = require("aws-sdk");
const crypto = require('crypto');

AWS.config.update({ region: process.env.REGION });

const documentClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async function(event, context, callback)
{
    if (!verifyPatreonHook(event))
    {
        console.log("Unauthorized");
        return {
            statusCode: 401,
            body: "Unauthorized"
        }
    }

    const body = JSON.parse(event.body);
    const patreonEvent = event.headers['X-Patreon-Event'];

    const patron = getPatronData(body);
    if (!patron)
    {
        // this ~should~ never happen
        console.log("Bad request");
        return {
            statusCode: 400,
            body: "Bad request"
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
        console.error(error);
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
    return digest === event.headers['X-Patreon-Signature'];
}

async function handlePatreonEvent(patron, event)
{
    switch (event)
    {
        case "members:pledge:create":
            return await pledgeCreate(patron);

        case "members:pledge:delete":
            return await pledgeDelete(patron);
    }
}

function getPatronData(body)
{
    let patron = body.data.relationships.user;
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

function pledgeCreate(user)
{
    return new Promise(function(resolve, reject)
    {
        const params = {
            Item:
            {
                "id": user.id,
                "vanity": user.attributes.vanity
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

function pledgeDelete(user)
{
    return new Promise(function(resolve, reject)
    {
        const params = {
            Key:
            {
                "id": user.id,
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