import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient();
const TABLE = process.env.DYNAMODB_TABLE;

export async function getDeals(event) {
  console.log('[getDeals] Received event:', JSON.stringify(event));
  const params = {
    TableName: TABLE,
  };
  console.log('[getDeals] Scan params:', params);
  try {
    const data = await client.send(new ScanCommand(params));
    console.log('[getDeals] Raw data from DynamoDB:', JSON.stringify(data));
    const items = data.Items ? data.Items.map(item => unmarshall(item)) : [];
    console.log('[getDeals] Unmarshalled items:', JSON.stringify(items));
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Origin": "https://master.d1vogg24whu6rr.amplifyapp.com",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error('[getDeals] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch deals', details: error.message }),
    };
  }
}

export async function createDeal(event) {
  console.log('[createDeal] Received event:', JSON.stringify(event));
  try {
    const body = JSON.parse(event.body);
    console.log('[createDeal] Parsed body:', JSON.stringify(body));
    const item = {
      id: `${body.season}#${body.episode}#${body.company}`,
      category: body.category ?? '-',
      closed_deal: body.closed_deal,
      participants: body.participants,
      investors: body.investors ?? [],
      amount_requested: body.amount_requested,
      equity_offered: body.equity_offered,
      amount_negotiated: body.amount_negotiated,
      equity_negotiated: body.equity_negotiated,
      proposal_type: body.proposal_type ?? '-',
      description: body.description
    };
    console.log('[createDeal] Item to insert:', JSON.stringify(item));
    const params = {
      TableName: TABLE,
      Item: marshall(item, { removeUndefinedValues: true }),
    };
    console.log('[createDeal] PutItem params:', params);
    await client.send(new PutItemCommand(params));
    console.log('[createDeal] Successfully inserted item');
    return {
      statusCode: 201,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('[createDeal] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create deal', details: error.message }),
    };
  }
}