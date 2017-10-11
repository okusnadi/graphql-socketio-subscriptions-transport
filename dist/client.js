import { EVENT_KEY } from './definitions';

import { SUBSCRIPTION_FAIL, SUBSCRIPTION_DATA, SUBSCRIPTION_START, SUBSCRIPTION_SUCCESS, SUBSCRIPTION_END } from './messageTypes';

export default class Client {
	constructor(ref) {
		this.ws = ref;
		this.subscriptions = {};
		this.maxId = 0;
		this.reconnectSubscriptions = {};
		this.unsentMessagesQueue = [];
		this.reconnecting = false;

		this.ws.on(EVENT_KEY, this.handleMessage.bind(this));

		this.ws.on('connect', () => {
			this.sendUnsentMessages();
		});

		this.ws.on('reconnect_attempt', () => {
			if (!this.reconnecting) {
				this.reconnectSubscriptions = this.subscriptions;
				this.subscriptions = {};
				this.reconnecting = true;
			}
		});

		this.ws.on('reconnect', () => {
			this.reconnecting = false;

			Object.keys(this.reconnectSubscriptions).forEach(key => {
				const { options, handler } = this.reconnectSubscriptions[key];

				this.subscribe(options, handler);
			});

			this.sendUnsentMessages();
		});
	}

	handleMessage({ id, type, payload }) {
		switch (type) {
			case SUBSCRIPTION_SUCCESS:
				this.subscriptions[id].pending = false;

				break;
			case SUBSCRIPTION_FAIL:
				this.subscriptions[id].handler(this.formatErrors(payload.errors), null);
				delete this.subscriptions[id];

				break;
			case SUBSCRIPTION_DATA:
				if (payload.data && !payload.errors) {
					this.subscriptions[id].handler(null, payload.data);
				} else {
					this.subscriptions[id].handler(this.formatErrors(payload.errors), null);
				}

				break;
			default:
				throw new Error('Invalid message type - must be of type `subscription_start` or `subscription_data`.');
		}
	}

	formatErrors(errors) {
		if (Array.isArray(errors)) {
			return errors;
		}
		if (errors && errors.message) {
			return [errors];
		}

		return [{ message: 'Unknown error' }];
	}

	generateSubscriptionId() {
		const id = this.maxId;
		this.maxId += 1;
		return id;
	}

	sendUnsentMessages() {
		this.unsentMessagesQueue.forEach(message => this.ws.emit(EVENT_KEY, message));

		this.unsentMessagesQueue = [];
	}

	sendMessage(message) {
		switch (this.ws.io.readyState) {
			case 'opening':
				this.unsentMessagesQueue.push(message);

				break;
			case 'open':
				this.ws.emit(EVENT_KEY, message);

				break;
			default:
				if (this.reconnecting) {
					this.unsentMessagesQueue.push(message);
				} else {
					throw new Error('Client is not connected to a websocket.');
				}

				break;
		}
	}

	subscribe(options, handler) {
		const { query, variables, operationName, context } = options;

		if (!query) {
			throw new Error('Must provide `query` to subscribe.');
		}

		if (!handler) {
			throw new Error('Must provide `handler` to subscribe.');
		}

		if (typeof query !== 'string' || operationName && typeof operationName !== 'string' || variables && !(variables instanceof Object)) {
			throw new Error('Incorrect option types to subscribe. `subscription` must be a string,' + '`operationName` must be a string, and `variables` must be an object.');
		}

		const subId = this.generateSubscriptionId();

		const message = Object.assign(options, {
			type: SUBSCRIPTION_START,
			id: subId
		});

		this.sendMessage(message);
		this.subscriptions[subId] = { options, handler, pending: true };

		return subId;
	}

	unsubscribe(id) {
		delete this.subscriptions[id];

		this.sendMessage({ id, type: SUBSCRIPTION_END });
	}

	unsubscribeAll() {
		Object.keys(this.subscriptions).forEach(subId => this.unsubscribe(parseInt(subId)));
	}
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnQuanMiXSwibmFtZXMiOlsiRVZFTlRfS0VZIiwiU1VCU0NSSVBUSU9OX0ZBSUwiLCJTVUJTQ1JJUFRJT05fREFUQSIsIlNVQlNDUklQVElPTl9TVEFSVCIsIlNVQlNDUklQVElPTl9TVUNDRVNTIiwiU1VCU0NSSVBUSU9OX0VORCIsIkNsaWVudCIsImNvbnN0cnVjdG9yIiwicmVmIiwid3MiLCJzdWJzY3JpcHRpb25zIiwibWF4SWQiLCJyZWNvbm5lY3RTdWJzY3JpcHRpb25zIiwidW5zZW50TWVzc2FnZXNRdWV1ZSIsInJlY29ubmVjdGluZyIsIm9uIiwiaGFuZGxlTWVzc2FnZSIsImJpbmQiLCJzZW5kVW5zZW50TWVzc2FnZXMiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsIm9wdGlvbnMiLCJoYW5kbGVyIiwic3Vic2NyaWJlIiwiaWQiLCJ0eXBlIiwicGF5bG9hZCIsInBlbmRpbmciLCJmb3JtYXRFcnJvcnMiLCJlcnJvcnMiLCJkYXRhIiwiRXJyb3IiLCJBcnJheSIsImlzQXJyYXkiLCJtZXNzYWdlIiwiZ2VuZXJhdGVTdWJzY3JpcHRpb25JZCIsImVtaXQiLCJzZW5kTWVzc2FnZSIsImlvIiwicmVhZHlTdGF0ZSIsInB1c2giLCJxdWVyeSIsInZhcmlhYmxlcyIsIm9wZXJhdGlvbk5hbWUiLCJjb250ZXh0Iiwic3ViSWQiLCJhc3NpZ24iLCJ1bnN1YnNjcmliZSIsInVuc3Vic2NyaWJlQWxsIiwicGFyc2VJbnQiXSwibWFwcGluZ3MiOiJBQUFBLFNBQVNBLFNBQVQsUUFBMEIsZUFBMUI7O0FBRUEsU0FDQ0MsaUJBREQsRUFFQ0MsaUJBRkQsRUFHQ0Msa0JBSEQsRUFJQ0Msb0JBSkQsRUFLQ0MsZ0JBTEQsUUFNTyxnQkFOUDs7QUFRQSxlQUFlLE1BQU1DLE1BQU4sQ0FBYTtBQUMzQkMsYUFBWUMsR0FBWixFQUFpQjtBQUNoQixPQUFLQyxFQUFMLEdBQVVELEdBQVY7QUFDQSxPQUFLRSxhQUFMLEdBQXFCLEVBQXJC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QWQsRUFBdUI7QUFDdENJLFNBQU14QixrQkFEZ0M7QUFFdEN1QixPQUFJcUI7QUFGa0MsR0FBdkIsQ0FBaEI7O0FBS0EsT0FBS1IsV0FBTCxDQUFpQkgsT0FBakI7QUFDQSxPQUFLMUIsYUFBTCxDQUFtQnFDLEtBQW5CLElBQTRCLEVBQUV4QixPQUFGLEVBQVdDLE9BQVgsRUFBb0JLLFNBQVMsSUFBN0IsRUFBNUI7O0FBRUEsU0FBT2tCLEtBQVA7QUFDQTs7QUFFREUsYUFBWXZCLEVBQVosRUFBZ0I7QUFDZixTQUFPLEtBQUtoQixhQUFMLENBQW1CZ0IsRUFBbkIsQ0FBUDs7QUFFQSxPQUFLYSxXQUFMLENBQWlCLEVBQUViLEVBQUYsRUFBTUMsTUFBTXRCLGdCQUFaLEVBQWpCO0FBQ0E7O0FBRUQ2QyxrQkFBaUI7QUFDaEIvQixTQUFPQyxJQUFQLENBQVksS0FBS1YsYUFBakIsRUFBZ0NXLE9BQWhDLENBQXdDMEIsU0FBUyxLQUFLRSxXQUFMLENBQWlCRSxTQUFTSixLQUFULENBQWpCLENBQWpEO0FBQ0E7QUFuSjBCIiwiZmlsZSI6ImNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVWRU5UX0tFWSB9IGZyb20gJy4vZGVmaW5pdGlvbnMnXG5cbmltcG9ydCB7XG5cdFNVQlNDUklQVElPTl9GQUlMLFxuXHRTVUJTQ1JJUFRJT05fREFUQSxcblx0U1VCU0NSSVBUSU9OX1NUQVJULFxuXHRTVUJTQ1JJUFRJT05fU1VDQ0VTUyxcblx0U1VCU0NSSVBUSU9OX0VORFxufSBmcm9tICcuL21lc3NhZ2VUeXBlcydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2xpZW50IHtcblx0Y29uc3RydWN0b3IocmVmKSB7XG5cdFx0dGhpcy53cyA9IHJlZlxuXHRcdHRoaXMuc3Vic2NyaXB0aW9ucyA9IHt9XG5cdFx0dGhpcy5tYXhJZCA9IDBcblx0XHR0aGlzLnJlY29ubmVjdFN1YnNjcmlwdGlvbnMgPSB7fVxuXHRcdHRoaXMudW5zZW50TWVzc2FnZXNRdWV1ZSA9IFtdXG5cdFx0dGhpcy5yZWNvbm5lY3RpbmcgPSBmYWxzZVxuXG5cdFx0dGhpcy53cy5vbihFVkVOVF9LRVksIHRoaXMuaGFuZGxlTWVzc2FnZS5iaW5kKHRoaXMpKVxuXG5cdFx0dGhpcy53cy5vbignY29ubmVjdCcsICgpID0+IHtcblx0XHRcdHRoaXMuc2VuZFVuc2VudE1lc3NhZ2VzKClcblx0XHR9KVxuXG5cdFx0dGhpcy53cy5vbigncmVjb25uZWN0X2F0dGVtcHQnLCAoKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMucmVjb25uZWN0aW5nKSB7XG5cdFx0XHRcdHRoaXMucmVjb25uZWN0U3Vic2NyaXB0aW9ucyA9IHRoaXMuc3Vic2NyaXB0aW9uc1xuXHRcdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSB7fVxuXHRcdFx0XHR0aGlzLnJlY29ubmVjdGluZyA9IHRydWVcblx0XHRcdH1cblx0XHR9KVxuXG5cdFx0dGhpcy53cy5vbigncmVjb25uZWN0JywgKCkgPT4ge1xuXHRcdFx0dGhpcy5yZWNvbm5lY3RpbmcgPSBmYWxzZVxuXG5cdFx0XHRPYmplY3Qua2V5cyh0aGlzLnJlY29ubmVjdFN1YnNjcmlwdGlvbnMpLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRjb25zdCB7IG9wdGlvbnMsIGhhbmRsZXIgfSA9IHRoaXMucmVjb25uZWN0U3Vic2NyaXB0aW9uc1trZXldXG5cblx0XHRcdFx0dGhpcy5zdWJzY3JpYmUob3B0aW9ucywgaGFuZGxlcilcblx0XHRcdH0pXG5cblx0XHRcdHRoaXMuc2VuZFVuc2VudE1lc3NhZ2VzKClcblx0XHR9KVxuXHR9XG5cblx0aGFuZGxlTWVzc2FnZSh7IGlkLCB0eXBlLCBwYXlsb2FkIH0pIHtcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgU1VCU0NSSVBUSU9OX1NVQ0NFU1M6XG5cdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uc1tpZF0ucGVuZGluZyA9IGZhbHNlXG5cblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgU1VCU0NSSVBUSU9OX0ZBSUw6XG5cdFx0XHRcdHRoaXMuc3Vic2NyaXB0aW9uc1tpZF0uaGFuZGxlcih0aGlzLmZvcm1hdEVycm9ycyhwYXlsb2FkLmVycm9ycyksIG51bGwpXG5cdFx0XHRcdGRlbGV0ZSB0aGlzLnN1YnNjcmlwdGlvbnNbaWRdXG5cblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgU1VCU0NSSVBUSU9OX0RBVEE6XG5cdFx0XHRcdGlmIChwYXlsb2FkLmRhdGEgJiYgIXBheWxvYWQuZXJyb3JzKSB7XG5cdFx0XHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zW2lkXS5oYW5kbGVyKG51bGwsIHBheWxvYWQuZGF0YSlcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnNbaWRdLmhhbmRsZXIodGhpcy5mb3JtYXRFcnJvcnMocGF5bG9hZC5lcnJvcnMpLCBudWxsKVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0YnJlYWtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBtZXNzYWdlIHR5cGUgLSBtdXN0IGJlIG9mIHR5cGUgYHN1YnNjcmlwdGlvbl9zdGFydGAgb3IgYHN1YnNjcmlwdGlvbl9kYXRhYC4nKVxuXHRcdH1cblx0fVxuXG5cdGZvcm1hdEVycm9ycyhlcnJvcnMpIHtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShlcnJvcnMpKSB7XG5cdFx0XHRyZXR1cm4gZXJyb3JzXG5cdFx0fVxuXHRcdGlmIChlcnJvcnMgJiYgZXJyb3JzLm1lc3NhZ2UpIHtcblx0XHRcdHJldHVybiBbZXJyb3JzXVxuXHRcdH1cblxuXHRcdHJldHVybiBbeyBtZXNzYWdlOiAnVW5rbm93biBlcnJvcicgfV1cblx0fVxuXG5cdGdlbmVyYXRlU3Vic2NyaXB0aW9uSWQoKSB7XG5cdFx0Y29uc3QgaWQgPSB0aGlzLm1heElkXG5cdFx0dGhpcy5tYXhJZCArPSAxXG5cdFx0cmV0dXJuIGlkXG5cdH1cblxuXHRzZW5kVW5zZW50TWVzc2FnZXMoKSB7XG5cdFx0dGhpcy51bnNlbnRNZXNzYWdlc1F1ZXVlLmZvckVhY2goXG5cdFx0XHRtZXNzYWdlID0+IHRoaXMud3MuZW1pdChFVkVOVF9LRVksIG1lc3NhZ2UpXG5cdFx0KVxuXG5cdFx0dGhpcy51bnNlbnRNZXNzYWdlc1F1ZXVlID0gW11cblx0fVxuXG5cdHNlbmRNZXNzYWdlKG1lc3NhZ2UpIHtcblx0XHRzd2l0Y2ggKHRoaXMud3MuaW8ucmVhZHlTdGF0ZSkge1xuXHRcdFx0Y2FzZSAnb3BlbmluZyc6XG5cdFx0XHRcdHRoaXMudW5zZW50TWVzc2FnZXNRdWV1ZS5wdXNoKG1lc3NhZ2UpXG5cblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgJ29wZW4nOlxuXHRcdFx0XHR0aGlzLndzLmVtaXQoRVZFTlRfS0VZLCBtZXNzYWdlKVxuXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRpZiAodGhpcy5yZWNvbm5lY3RpbmcpIHtcblx0XHRcdFx0XHR0aGlzLnVuc2VudE1lc3NhZ2VzUXVldWUucHVzaChtZXNzYWdlKVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignQ2xpZW50IGlzIG5vdCBjb25uZWN0ZWQgdG8gYSB3ZWJzb2NrZXQuJylcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXHR9XG5cblx0c3Vic2NyaWJlKG9wdGlvbnMsIGhhbmRsZXIpIHtcblx0XHRjb25zdCB7IHF1ZXJ5LCB2YXJpYWJsZXMsIG9wZXJhdGlvbk5hbWUsIGNvbnRleHQgfSA9IG9wdGlvbnNcblxuXHRcdGlmICghcXVlcnkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignTXVzdCBwcm92aWRlIGBxdWVyeWAgdG8gc3Vic2NyaWJlLicpXG5cdFx0fVxuXG5cdFx0aWYgKCFoYW5kbGVyKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ011c3QgcHJvdmlkZSBgaGFuZGxlcmAgdG8gc3Vic2NyaWJlLicpXG5cdFx0fVxuXG5cdFx0aWYgKFxuXHRcdFx0KCB0eXBlb2YgcXVlcnkgIT09ICdzdHJpbmcnICkgfHxcblx0XHRcdCggb3BlcmF0aW9uTmFtZSAmJiAodHlwZW9mIG9wZXJhdGlvbk5hbWUgIT09ICdzdHJpbmcnKSApIHx8XG5cdFx0XHQoIHZhcmlhYmxlcyAmJiAhKHZhcmlhYmxlcyBpbnN0YW5jZW9mIE9iamVjdCkgKVxuXHRcdCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbmNvcnJlY3Qgb3B0aW9uIHR5cGVzIHRvIHN1YnNjcmliZS4gYHN1YnNjcmlwdGlvbmAgbXVzdCBiZSBhIHN0cmluZywnICtcblx0XHRcdCdgb3BlcmF0aW9uTmFtZWAgbXVzdCBiZSBhIHN0cmluZywgYW5kIGB2YXJpYWJsZXNgIG11c3QgYmUgYW4gb2JqZWN0LicpXG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3ViSWQgPSB0aGlzLmdlbmVyYXRlU3Vic2NyaXB0aW9uSWQoKVxuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IE9iamVjdC5hc3NpZ24ob3B0aW9ucywge1xuXHRcdFx0dHlwZTogU1VCU0NSSVBUSU9OX1NUQVJULFxuXHRcdFx0aWQ6IHN1YklkXG5cdFx0fSlcblxuXHRcdHRoaXMuc2VuZE1lc3NhZ2UobWVzc2FnZSlcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnNbc3ViSWRdID0geyBvcHRpb25zLCBoYW5kbGVyLCBwZW5kaW5nOiB0cnVlIH1cblxuXHRcdHJldHVybiBzdWJJZFxuXHR9XG5cblx0dW5zdWJzY3JpYmUoaWQpIHtcblx0XHRkZWxldGUgdGhpcy5zdWJzY3JpcHRpb25zW2lkXVxuXG5cdFx0dGhpcy5zZW5kTWVzc2FnZSh7IGlkLCB0eXBlOiBTVUJTQ1JJUFRJT05fRU5EIH0pXG5cdH1cblxuXHR1bnN1YnNjcmliZUFsbCgpIHtcblx0XHRPYmplY3Qua2V5cyh0aGlzLnN1YnNjcmlwdGlvbnMpLmZvckVhY2goc3ViSWQgPT4gdGhpcy51bnN1YnNjcmliZShwYXJzZUludChzdWJJZCkpKVxuXHR9XG59XG4iXX0=