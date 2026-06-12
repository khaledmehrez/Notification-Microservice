import {
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsGuard } from './ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway(3010, {
	path: '/notification-socket',
	transports: ['websocket'],
	cors: {
		origin: '*',
	},
})
export class WebsocketGateway implements OnGatewayConnection {
	constructor(private jwtService: JwtService) {}

	@WebSocketServer()
	server: Server;

	@UseGuards(WsGuard)
	@SubscribeMessage('onConnect')
	createUserRoom(socket: Socket): WsResponse<unknown> {
		socket.join(socket.handshake.auth.user);
		return;
	}

	send(userId: string, event: string, data: any): WsResponse<unknown> {
		this.server.to(userId).emit(event, data);
		return;
	}

	async handleConnection(client: any): Promise<any> {
		try {
			const decoded = this.jwtService.verify(client.handshake.auth.token, {
				secret: process.env.JWT_ACCESS_TOKEN_SECRET,
			});
			if (!decoded.user) {
				client.disconnect();
			}
			client.join(decoded.user);
		} catch (ex) {
			client.disconnect(ex.message);
		}
	}
}
