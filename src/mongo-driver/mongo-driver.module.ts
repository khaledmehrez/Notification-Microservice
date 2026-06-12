import { DynamicModule, Global, Module } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { MongoDriverService } from './mongo-driver.service';

export interface DatabaseModuleOptions {
	mongoURL?: string;
}

@Global()
@Module({})
export class MongoDriverModule {
	static register(options: DatabaseModuleOptions): DynamicModule {
		return {
			module: MongoDriverModule,
			providers: [
				{
					provide: 'DATABASE_CONNECTION',
					useFactory: async (): Promise<Db> => {
						try {
							const client = await MongoClient.connect(options.mongoURL, {
								maxPoolSize: 200,
							});
							return client.db('lovester');
						} catch (e) {
							throw e;
						}
					},
				},
				MongoDriverService,
			],
			exports: ['DATABASE_CONNECTION', MongoDriverService],
		};
	}
}
