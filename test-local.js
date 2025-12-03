async function testServer() {
    try {
        const body = JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: 'pronostico',
                arguments: {
                    city: 'Madrid'
                },
            },
            id: 1,
        });

        console.log('Sending request to http://localhost:3000/api');
        console.log('Body:', body);

        const response = await fetch('http://localhost:3000/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
            },
            body: body,
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const text = await response.text();
            console.log('Response body:', text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw response:', text);

        // Parsear el stream de eventos
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonData = line.substring(6);
                try {
                    const data = JSON.parse(jsonData);
                    console.log('Response:', JSON.stringify(data, null, 2));
                } catch (e) {
                    console.log('Could not parse as JSON:', jsonData);
                }
            }
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testServer();
