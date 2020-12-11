import net from 'net';
import path from 'path';
import fs, { promises } from 'fs';

const PORT = 3030;
const host = 'localhost';

//Pagina com os arquivos acessados pelas requisições
const web = path.join('pages');

console.log(web)

const fileToContentType = {
	'html': 'text/html',
	'jpg':  'application/x-jpg'
}

const HEADER_404 = "HTTP/1.1 404 Not Found\r\nDate: Thu, 24 Sep 2020 11:00:00 GMT\r\n\n<h1>Not found</h1>\r\n\n"

const prepareBufferContent = (statusCode: number, ...args: string[]) => {
	const rawHeaders: string[] = [];
	if (statusCode == 200) {
		rawHeaders.push('HTTP/1.1 200 OK\r\nDate: Thu, 24 Sep 2020 11:00:00 GMT\r');
		if (args && args.length > 0) {
			args.map(headerLine => {
				rawHeaders.push(headerLine.concat('\r'));
			})
		}
	} else {
		rawHeaders.push(HEADER_404);
	}
	
	rawHeaders.push('\n\n');
	return rawHeaders;
}

const netServer = net.createServer();

netServer.on('connection', socket => {
	console.log('Conexão estabalecida com:', `${socket.remoteAddress}:${socket.remotePort}`);

	socket.on('data', (buffer) => {
		const request = buffer.toString('ascii');
		const [firstLine, ] = request.split('\n', 1);
		const [httpMethod, url,] = firstLine.split(' ');
	
		console.log('Método: ', httpMethod);
		console.log('Url:', url);

		var filePath: string = '';
		var fileType: string = '';
		if (url == '/') {
			filePath = path.join(web, 'index.html');
			fileType = 'html';

		} else {
			[, fileType] = url.split('.');

			filePath = path.join(web, url);
		}
		
		console.log(filePath);
		if (fs.existsSync(web)) { 
			console.log('File path', filePath);
			promises.readFile(filePath).then(buffer => {
				console.log("Enviando");
				const content = prepareBufferContent(200, fileToContentType[fileType]);
				socket.write(Buffer.from(''.concat(...content)));
				socket.write(buffer);
				socket.write(Buffer.from('\r\n\n'));
				socket.end();

				socket.destroy();
			}).catch(error => {
				const content = prepareBufferContent(404);
				socket.write(Buffer.from(''.concat(...content)));
				socket.end();
				socket.destroy();
				
				console.error(error);
			});
		} else {
			console.log("Nao existe");
			const content = prepareBufferContent(404);
			socket.write(Buffer.from(content));
			socket.end();
			socket.destroy();
		}
	});
});

netServer.listen(PORT, host, () => {
	console.log('Servidor está ouvindo na porta:', netServer.address());
});
