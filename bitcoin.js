/* jshint node: true, devel: true, esversion: 6 */
'use strict';

const
	request = require('request')
;

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
	getPrice ({ticker = 'last', timeframe = 1, backend = 'btcoid', resolution = 90} = {})
	{
		
		// different ticker for BCC: Bitcoin Chart
		const translateTicker = {
			'last': 'close',
			'high': 'high',
			'low': 'low',
			'vol_btc': 'volume'			
		};
		
		
		if (backend == 'btcoid')
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
					
					if (!ticker in body)
					{
						console.log("Missing body.ticker (?)");
						return reject(body);
					}
					
					if (!ticker in body.ticker)
					{
						console.log("Missing body.ticker.ticker (?)");
						return reject(body.ticker);
					}
					
					return resolve(body.ticker[ticker]);
				});					
			});
		} else if (backend == 'btcchart') {
			// Get from bitcoin chart
			
			let tickerBCC
			if (ticker in translateTicker) {
				tickerBCC = translateTicker[ticker];
			} else {
				console.log("Warn: ticker not translated")
				tickerBCC = ticker;
			}
			
			
			return new Promise((resolve, reject) => {
				this.getBitcoinchartsOHLC(timeframe, resolution)
					.then((OLHCArray)=>{
						return resolve(this.getLast(OLHCArray, tickerBCC));
					})
					.catch((error) => {
						console.log("Error:", error)
						return reject(error);
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
		if (!OLHCArray[ticker]) {
			console.log("Invalid ticker:", ticker)
		}
		console.log(OLHCArray[ticker])
		
		
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
			obj.low = [];
			obj.high = [];
			obj.close = [];
			obj.volume = [];
			return obj;
		}
		// open: [...], low: [...], high: [...], close: [...], volume: [...] };
		obj.timestamp.push(element[0]);
		obj.open.push(element[1]);
		obj.low.push(element[2]);
		obj.high.push(element[3]);
		obj.close.push(element[4]);
		obj.volume.push(element[5]);
	}
		
}