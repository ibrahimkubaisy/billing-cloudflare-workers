export const email = async (c: any, to: string[], subject: string, emailBody: string): Promise<Response> => {
	const mailgunApiKey = c.env.MAILGUN_API_KEY;
	const domain = c.env.MAILGUN_DOMAIN;

	// Prepare form data equivalent to -F flags in curl
	const formData = new URLSearchParams();
	formData.append('from', c.env.MAILGUN_FROM_ADDRESS);
	to.map((_to) => formData.append('to', _to));
	formData.append('subject', subject);
	formData.append('text', emailBody);

	const req = {
		method: 'POST',
		headers: {
			Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`, // Base64 encode the API key
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: formData.toString(),
	};

	console.log({ req });
	// Perform the API call with basic authentication
	const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, req);

	return response;
};
