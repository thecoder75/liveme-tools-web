/*

	  _      _           __  __        _______          _     
	 | |    (_)         |  \/  |      |__   __|        | |    
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___ 
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/

													v3.0.0
		
		(c)2017 by TheCoder - Licensed under GPL now


	This is where the magic is...
*/
var	callback_holder = null, query = '', query_orig = '', page_index = 0, return_data = [], index = 0, max_count = 0;
var build_table = [], build_table2 = [];


function getuservideos (u, cb) {

	query = u;
	callback_holder = cb;
	return_data = {
		userinfo: {
			userid: 0
		},
		videos: []
	};

	if (query.length == 18) {		
		_dolookup1();
	} else if (query.length < 18) {
		cb(return_data);
	} else {
		query_orig = u;
		_dolookup();
	}

}

function searchkeyword(k, cb) {

	query = k;
	callback_holder = cb;
	page_index = 1;
	return_data = [];
	_dosearch();
}


function _dolookup() {

	$.ajax({
		url: 'http://live.ksmobile.net/live/queryinfo',
		data: {
			userid: 0,
			videoid: query
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {
			console.log(e);
			if (e.data.length == 0) {
				callback_holder(return_data);
				return;
			}

			if (e.data.user_info !== undefined) {
				query = e.data.user_info.userid;
				_dolookup1();
			} else {
				callback_holder(return_data);
			}
			
		}
	});
}

function _dolookup1() {


	$.ajax({
		url: 'http://live.ksmobile.net/user/getinfo',
		data: {
			userid: query
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {
			if (e.status != 500) {
				return_data.userinfo = {
					userid: e.data.user.user_info.uid,
					username: e.data.user.user_info.nickname,
					sex: e.data.user.user_info.sex == 0 ? 'female' : 'male',
					usericon: e.data.user.user_info.face,
					level: parseInt(e.data.user.user_info.level),
					following: parseInt(e.data.user.count_info.following_count),
					fans: parseInt(e.data.user.count_info.follower_count)
				}
			}
			_dolookup2();			
		}
	});



}

function _dolookup2() {

	$.ajax({
		url: 'http://live.ksmobile.net/live/getreplayvideos',
		data: {
			userid: query,
			page_size: 20,
			page_index: page_index
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {

			if (e.data.length == 0) {
				_dolookup3();
				return;
			}

			if (e.data.video_info !== undefined) {
				for (i = 0; i < e.data.video_info.length; i++) {
					return_data.videos.push({
						url : e.data.video_info[i].hlsvideosource,
						dt :  parseInt(e.data.video_info[i].vtime),
						deleted : false,
						title : e.data.video_info[i].title,
						length : parseInt(e.data.video_info[i].videolength),
						videoid : e.data.video_info[i].vdoid,
						plays : e.data.video_info[i].watchnumber,
						shares : e.data.video_info[i].sharenum,
						likes : e.data.video_info[i].likenum,
						location : { country: e.data.video_info[i].countryCode },
						private: false
					});
				}
			}

			if (e.data.video_info !== undefined) {
				if (query_orig.length < 1) {
					callback_holder(return_data);
				} else {
					_dolookup3();
				}
				return;
			} else if (page_index < 20) {
				if (e.data.video_info.length < 20) {
					_dolookup3();			
				} else {
					page_index++;
					_dolookup2();
				}
				return;
			} else {
				_dolookup3();
				return;
			}

		}
	});
}

function _dolookup3() {

	if (query_orig.length < 1) {
		callback_holder(return_data);
		return;
	}

	$.ajax({
		url: 'http://live.ksmobile.net/live/queryinfo',
		data: {
			userid: 0,
			videoid: query_orig
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {

			if (e.data.length == 0) {
				callback_holder(return_data);
				return;
			}

			var add = true;

			for (i = 0; i < return_data.videos.length; i++) {
				if (return_data.videos[i].videoid == e.data.video_info.vdoid) add = false;
			}
			
			if (add == true) {
				return_data.videos.push({
					url : e.data.video_info.hlsvideosource,
					dt :  parseInt(e.data.video_info.vtime),
					deleted : false,
					title : e.data.video_info.title,
					length : parseInt(e.data.video_info.videolength),
					videoid : e.data.video_info.vdoid,
					plays : e.data.video_info.watchnumber,
					shares : e.data.video_info.sharenum,
					likes : e.data.video_info.likenum,
					location : { country: e.data.video_info.countryCode },
					private: true
				});
			}
			callback_holder(return_data);			
		}
	});


}



/*
	User Lookup Search
*/
function _dosearch() {


	$.ajax({
		url: 'http://live.ksmobile.net/search/searchkeyword',
		data: {
			keyword: encodeURI(query),
			page_size: 10,
			page_index: page_index
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {

			for (i = 0; i < e.data.data_info.length; i++) {
				return_data.push({
					userid : e.data.data_info[i].user_id
				});
			}

			if (page_index < 3) {
				if (e.data.data_info.length < 10) {
					index = 0;
					max_count = return_data.length - 1;
					_dosearch2();			
				} else {
					page_index++;
					_dosearch();
				}
			} else {
				index = 0;
				max_count = return_data.length - 1;
				_dosearch2();			
			}		

		}
	});


}

function _dosearch2() {

	$.ajax({
		url: 'http://live.ksmobile.net/user/getinfo',
		data: {
			userid: return_data[index].userid
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {
			
			return_data[index] = {
					userid: e.data.user.user_info.uid,
					nickname: e.data.user.user_info.nickname,
					sex: e.data.user.user_info.sex == 0 ? 'female' : 'male',
					thumb: e.data.user.user_info.face,
					level: parseInt(e.data.user.user_info.level),
					followings: parseInt(e.data.user.count_info.following_count),
					fans: parseInt(e.data.user.count_info.follower_count),
					videos : [],
					videosplus : false
			};

			if (index < max_count) {
				index++;
				_dosearch2();
			} else {
				index = 0;
				_dosearch3();
			}

		}
	});
}

function _dosearch3() {


	$.ajax({
		url: 'http://live.ksmobile.net/live/getreplayvideos',
		data: {
			userid: return_data[index].userid,
			page_index: 1,
			page_size: 12
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {

			var max = e.data.video_info.length;
			if (max > 10) max = 10;
			for (i = 0; i < max; i++) {
				return_data[index].videos.push({
					url: e.data.video_info[i].hlsvideosource,
					dt: parseInt(e.data.video_info[i].vtime),
					length: parseInt(e.data.video_info[i].videolength),
					videoid: e.data.video_info[i].vdoid,
					title: e.data.video_info[i].title,
					views: e.data.video_info[i].watchnumber,
					plays: e.data.video_info[i].playnumber,
					likes: e.data.video_info[i].likenum,
					shares: e.data.video_info[i].sharenum,
					location: { country : e.data.video_info[i].countryCode }
				});
			}
			return_data[index].videosplus = e.data.video_info.length > 10 ? true : false;

			if (index < max_count) {
				index++;
				_dosearch3();
			} else {
				callback_holder({ data: return_data });
			}	

		}
	});
}

