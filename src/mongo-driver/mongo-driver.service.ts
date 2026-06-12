import { Db, Filter, FindOptions, AggregateOptions } from 'mongodb';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Document } from 'bson';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MongoDriverService {
	constructor(
		@Inject('DATABASE_CONNECTION') private db: Db,
		@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
	) {}

	async find(collection: string, filter: Filter<any>, options?: FindOptions): Promise<any> {
		try {
			return await this.db.collection(collection).find(filter, options).toArray();
		} catch (e) {
			throw new InternalServerErrorException(e);
		}
	}

	async count(collection: string, filter: Filter<any>, options?: FindOptions): Promise<any> {
		try {
			return await this.db.collection(collection).countDocuments(filter, options);
		} catch (e) {
			throw new InternalServerErrorException(e);
		}
	}

	async findOne(collection: string, filter: Filter<any>, options?: FindOptions): Promise<any> {
		try {
			return await this.db.collection(collection).findOne(filter, options);
		} catch (e) {
			throw new InternalServerErrorException(e);
		}
	}

	async aggregation(collection: string, pipeline?: Document[], options?: AggregateOptions): Promise<any> {
		try {
			return await this.db.collection(collection).aggregate(pipeline, options).toArray();
		} catch (e) {
			this.logger.error(e);
			throw new InternalServerErrorException(e);
		}
	}
}
