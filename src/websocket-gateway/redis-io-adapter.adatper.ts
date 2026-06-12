import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export class RedisIoAdapter extends IoAdapter {
	private adapterConstructor: ReturnType<typeof createAdapter>;
	constructor(
		private app: INestApplicationContext,
		private configService: ConfigService,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {
		super(app);
	}

	async connectToRedis(): Promise<void> {
		const pubClient = createClient({
			url: `redis://${process.env.NOTIFICATION_REDIS_HOST}:${process.env.NOTIFICATION_REDIS_PORT}`,
			database: 0,
			name: process.env.NOTIFICATION_SENTINEL_NAME,
			password: process.env.NOTIFICATION_SENTINEL_PASSWORD,
		});
		const subClient = pubClient.duplicate();
		pubClient.on('error', (err: any) => {
			this.logger.log('error', {
				context: 'Socket.io Redis - Pub Client - Notification',
				message: err.message,
				err: err,
				stack: err.stack,
			});
		});
		subClient.on('error', (err: any) => {
			this.logger.log('error', {
				context: 'Socket.io Redis - Sub Client - Notification',
				message: err.message,
				err: err,
				stack: err.stack,
			});
		});

		await Promise.all([pubClient.connect(), subClient.connect()]);

		this.adapterConstructor = createAdapter(pubClient, subClient);
	}

	createIOServer(port: number, options?: ServerOptions): any {
		port = this.configService.get<number>('WEBSOCKET_PORT');
		const server = super.createIOServer(port, options);
		server.adapter(this.adapterConstructor);
		return server;
	}
}
