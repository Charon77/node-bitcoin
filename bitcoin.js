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
	getPrice ({timeframe = 1, backend = 'btcoid', resolution = '30-min'} = {})
	{
		
		
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
										
					return resolve(body.ticker);
				});					
			});
		} else if (backend == 'btcchart') {
			// Get from bitcoin chart
			return new Promise((resolve, reject) => {
				this.getBitcoinchartsOHLC(arguments[0])
					.then((OLHCArray)=>{
						//return resolve(this.getLast(OLHCArray, tickerBCC)); // Returns last thing
						return resolve(OLHCArray.last)
					})
					.catch((error) => {
						console.log("Error:", error)
						return reject(error);
					});
			});
		}
	},
	
	getBitcoinchartsOHLC({timeframe = 1, resolution = '30-min', transpose = false} = {})
	{
		return new Promise((resolve, reject) => {
			this._getRawBitcoinOHLC(arguments[0])
			.then((arr) => {
				if (!transpose) {
					let OLHCArray = this._addToOLHCArray();
					return resolve(
						arr.map((olhc)=> {
						let [t,o,l,h,c,v,w,x] = olhc
						return {
							timestamp: t,
							open: o,
							low: l,
							high: h,
							close: c,
							volume_btc: v,
							volume_cur: w,
							weighted_price: x}
						})
					);
				} else {
					let OLHCArray = this._addToOLHCArray();
					arr.map((e) => {
						this._addToOLHCArray(e, OLHCArray);
					});
					return resolve(OLHCArray);
				}
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
	
	_getRawBitcoinOHLC({
		timeframe = 1,
		resolution = '30-min',
		customTime = {
			startTime: startTime,
			stopTime: stopTime
		}
	})
	{
		return new Promise ((resolve, reject) => {
			let r = request({
				// Resolution is Daily, Weekly, 30-min, etc
				url: 'https://bitcoincharts.com/charts/chart.json',
				qs: {
					m: 'btcoidIDR',
					i: resolution,
					SubmitButton: 'Draw',
					r: timeframe
					}
			},
			(error, response, body) => {
				console.log(response)
				if (error) {
					console.log("_getRawBitcoinOLHC");
					return reject(error);
				}
				// Format: Timestamp, Open, High, Low, Close, Volume(BTC), Volume (Currency), Weighted Price
				return resolve(body);
			})
			
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