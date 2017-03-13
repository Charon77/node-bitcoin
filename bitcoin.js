/* jshint node: true, devel: true, esversion: 6 */
'use strict';

const
	request = require('request'),
	talib = require('talib')
;

const Talib = function ({}) {
	const talibArgs = arguments[0];
	return new Promise((resolve, reject) => {
		talib.execute(talibArgs, function({error, result}) {
			if (error) {
				console.log(result)
				return reject(error)
			}
			return resolve(result)
		})
	})
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
		return OLHCArray.last;
	},
	
	getStochastic({backend, transpose = true} = {})
	{
		const isClosing = (lineA, lineB) => {
			console.log(lineA.last ,lineB.last);
			return (lineA.last - lineB.last);
		};
		return new Promise ((resolve, reject)=>{
			this.getBitcoinchartsOHLC(Object.assign({}, arguments[0], {transpose: true}))
			.then((marketData)=>{
				Talib({
					name: "STOCH",
					startIdx: 0,
					endIdx: marketData.close.length - 1,
					high: marketData.high,
					low: marketData.low,
					close: marketData.close,
					optInFastK_Period: 14,
					optInSlowK_Period: 5,
					optInSlowK_MAType: 2,
					optInSlowD_Period: 3,
					optInSlowD_MAType: 2
				})
				.then(result=>{
					//return resolve(isClosing(result.outSlowK, result.outSlowD));
					return resolve(result)
				})
				.catch(error=>console.log("Talib err:",error))
				;
			})
			.catch(error=>console.log("Stoch err:",error))
			;
		});
		
	},
	_getRawBitcoinOHLC({
		timeframe = 1,
		resolution = '30-min'		
	} = {})
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
					},
				json: true
			},
			(error, response, body) => {
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