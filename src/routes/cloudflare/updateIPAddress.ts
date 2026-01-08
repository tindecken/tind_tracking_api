import { Hono } from "hono";
import { tbValidator } from '@hono/typebox-validator'
import Type from 'typebox'
import type { GenericResponseInterface } from '../../models/GenericResponseInterface';

export const updateIPAddress = new Hono();

const schema = Type.Object({
  bearer: Type.String(),
  zoneId: Type.String(),
  dnsRecordID: Type.String(),
  ip: Type.Optional(Type.String()),
})
updateIPAddress.post('/updateIPAddress', tbValidator('json', schema), async (c) => {
  try {
    const { bearer, zoneId, dnsRecordID, ip } = await c.req.json();
    
    // Get IP address if not provided
    let ipAddress = ip;
    if (!ipAddress) {
      const ipResponse = await fetch('https://api.ipify.org/?format=text');
      ipAddress = await ipResponse.text();
    }
    
    // Get current datetime for comment
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0] || '';
    const currentDateTime = currentDate + ' ' + currentTime.substring(0, 5);
    
    // Update Cloudflare DNS record
    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${dnsRecordID}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${bearer}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'tindecken.xyz',
          ttl: 1,
          type: 'A',
          comment: `Updated via API on ${currentDateTime}`,
          content: ipAddress,
          proxied: false
        })
      }
    );
    
    if (!cloudflareResponse.ok) {
      const errorData = await cloudflareResponse.text();
      throw new Error(`Cloudflare API error: ${cloudflareResponse.status} - ${errorData}`);
    }
    
    const result = await cloudflareResponse.json();
    
    const res: GenericResponseInterface = {
      success: true,
      message: 'Update IP Address successfully.',
      data: result,
    };
    return c.json(res, 200);
  } catch (error: any) {
    const response: GenericResponseInterface = {
      success: false,
      message: error
        ? `Error while update IP Address: ${error}${error.code ? ` - ${error.code}` : ""}`
        : "Error while update IP Address",
      data: null,
    };
    return c.json(response, 500);
  }
})