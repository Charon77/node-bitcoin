'use strict';
/* jshint node: true, devel: true */

const
	request = require('request')
;

const Talib = (options) => {
	return new Promise ((resolve, reject)=>{
		console.log("Calculating");
		talib.execute(options, resolve);
	});
}

if (!Array.prototype.hasOwnProperty('last')){
	Object.defineProperty(Array.prototype, 'last', {
		get: function(){
			return this[this.length - 1];
		}
	},
	{
		configurable: true
	});
}

module.exports = 
{
	getPrice (ticker, timeframe)
	{
		// different ticker for BCC: Bitcoin Chart
		const translateTicker = {
			'high': 'high',
			'low': 'low',
			'vol_btc': 'volume'			
		};
		
		if (ticker == 'last')
		{
			// Get result from BTCID
			//Ticker: last, high, low, vol_btc, vol_idr, buy, sell
			return new Promise((resolve, reject) => {
				request({
					uri: 'https://vip.bitcoin.co.id/api/btc_idr/ticker',
					json: true
				}, function (error, response, body) {
					if (error)
					{
						console.log(error);
						return reject(error);
					}
					
					if (!body)
					{
						console.log("Missing body (?)");
						return reject(error);
					}
					
					if (!body.ticker)
					{
						console.log("Missing body.ticker (?)");
						return reject(body);
					}
					
					return resolve(body.ticker[ticker]);
				});					
			});
		} else {
			// Get from bitcoin chart
			const tickerBCC = translateTicker[ticker];
			timeframe = timeframe || 1;
			return new Promise((resolve, reject) => {
				let resolution;
				if (ticker == 'vol_btc')
				{
					resolution = '30-min';
					if (timeframe > 1)
					{
						resolution = 'Daily';
					}
				}
				this.getBitcoinchartsOHLC(timeframe, resolution)
					.then((OLHCArray)=>{
						return resolve(this.getLast(OLHCArray, tickerBCC));
					});
			});
		}
	},
	
	getBitcoinchartsOHLC(timeframe, resolution)
	{
		return new Promise((resolve, reject) => {
			this._getRawBitcoinOHLC(timeframe || 90, resolution || 'Daily')
			.then((arr) => {
				var OLHCArray = this._addToOLHCArray();
				arr.map((e) => {
					this._addToOLHCArray(e, OLHCArray);
				});
				return resolve(OLHCArray);
			})
			.catch((error) =>
			{
				console.log("Error: getBitcoinchartsOHLC, _getRawBitcoinOHLC");
				console.log(error);
				return reject(error);
			})
			;
		});
	},
	
	getLast(OLHCArray, ticker)
	{
		return OLHCArray[ticker].last;
	},
	
	_getRawBitcoinOHLC(timeframe, resolution)
	{
		return new Promise ((resolve, reject) => {
			request({
				// Resolution is Daily, Weekly, 30-min, etc
				uri: 'https://bitcoincharts.com/charts/chart.json?m=btcoidIDR&i=' + resolution +'&SubmitButton=Draw&r='+timeframe,
				json: true
			},
			(error, response, body) => {
				if (error) {
					console.log("_getRawBitcoinOLHC");
					return reject(error);
				}
				// Format: Timestamp, Open, High, Low, Close, Volume(BTC), Volume (Currency), Weighted Price
				return resolve(body);
			});
		});
	},
	
	_addToOLHCArray(element, obj)
	{
		if (obj==null)
		{
			obj = {};
			obj.timestamp = [];
			obj.open = [];
			obj.close = [];
			obj.high = [];
			obj.low = [];
			obj.volume = [];
			return obj;
		}
		// open: [...], close: [...], high: [...], low: [...], volume: [...] };
		obj.timestamp.push(element[0]);
		obj.open.push(element[1]);
		obj.close.push(element[2]);
		obj.high.push(element[3]);
		obj.low.push(element[4]);
		obj.volume.push(element[5]);
	}
		
}