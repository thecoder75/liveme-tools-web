/*
		  _      _           __  __        _______          _     
		 | |    (_)         |  \/  |      |__   __|        | |    
		 | |     ___   _____| \  / | ___     | | ___   ___ | |___ 
		 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
		 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
		 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/


*/
var isSearching = false, debounced = false;

$(function(){
	setTimeout(function(){ onTypeChange(); }, 50);
});

function enterOnSearch(e) { if (e.keyCode == 13) beginSearch(); } 

function onTypeChange() {
	var t=$('#type').val();
	switch (t) {
		case 'user-lookup': $('#query').attr('placeholder', 'Short or Long UserID'); $('#maxlevel').hide(); break;
		case 'video-lookup': $('#query').attr('placeholder', 'Enter VideoID'); $('#maxlevel').hide(); break;
		case 'url-lookup': $('#query').attr('placeholder', 'Enter URL'); $('#maxlevel').hide(); break;
		case 'search': $('#query').attr('placeholder', 'Enter Partial or Full Username'); $('#maxlevel').show(); break;
	}
}

function userSearch(id) { 
	$('#query').val(id);
	$('#type').val('user-lookup');
	beginSearch2();
}

function beginSearch() {
	if (isSearching) { return; }

	var u=$('#query').val(), isnum = /^\d+$/.test(u);

	if ((u.length==20) && (isnum)) {
		if ($('#type').val() != 'video-lookup') {
			$('#type').val('video-lookup');
			onTypeChange();
		}
	} else if ((u.length == 18) && (isnum)) {
		if ($('#type').val() != 'user-lookup') {
			$('#type').val('user-lookup');
			onTypeChange();
		}
	} else if (u.indexOf('http') > -1) {
		if ($('#type').val() != 'url-lookup') {
			$('#type').val('url-lookup');
			onTypeChange();
		}
	} else {
		if ($('#type').val() != 'search') {
			$('#type').val('search');
			onTypeChange();
		}
	}
	beginSearch2();
}

function beginSearch2() {
	if (isSearching) { return; }

	isSearching = true;
	$('#overlay').show();
	$('#main').html('');


	var u=$('#query').val(), isnum = /^\d+$/.test(u);
	if ($('#type').val() == 'url-lookup') {
		var q = '', u=$('#query').val(), t=u.split('/');

		if (u.indexOf('/live/') > -1) {
			$('#type').val('video-lookup');
			$('#query').val(u[3]);
			setTimeout(function(){
				beginSearch2();
			}, 100);

		} else if (t[t.length-1].indexOf('yolo') > -1) {
			var a=t[t.length - 1].split('-');
			$('#type').val('video-lookup');
			$('#query').val(a[1]);
			setTimeout(function(){
				beginSearch2();
			}, 100);
			
		} else if (u.indexOf('videoid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');
			console.log(a);
			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('videoid') > -1) {
					var c=b[i].split('=');
					
					$('#type').val('video-lookup');
					$('#query').val(c[1]);
					setTimeout(function(){
						beginSearch2();
					}, 100);

				}
			}
		} else if (u.indexOf('userid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');
			console.log(a);
			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('userid') > -1) {
					var c=b[i].split('=');
					
					$('#type').val('user-lookup');
					$('#query').val(c[1]);
					setTimeout(function(){
						beginSearch2();
					}, 100);

				}
			}
		} else {
			$('#main').html('<div class="emptylist">Unsupported URL detected.</div>');
		}

		isSearching = false;
		$('#overlay').hide();
		
	}

	if ($('#type').val() == 'search') {
		searchkeyword($('#query').val(), function(e) {
			isSearching = false;
			$('#main').html('<div id="results" class="panel"></div>'); 
			renderSearchResults(e.data);
			$('#overlay').hide();
		});
	} else {
		getuservideos($('#query').val(), function(e){
			isSearching = false;
			if ((typeof(e.userinfo.userid) === undefined) || (e.userinfo.userid == 0)) {
				$('#main').html('<div class="emptylist">Search returned nothing.</div>');
			} else {
				$('#main').html('<div id="userinfo" class="panel"></div><div id="videolist" class="panel"></div>'); 
				renderUserLookup(e);
			}
			$('#overlay').hide();
		});
	}	
}

function showFollowing(u,m) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);
	window.open('following.html?'+u+'#'+m,'_followings_'+u,'width=360,height=640,resizable=no');
}

function showFans(u,m) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);
	window.open('fans.html?'+u+'#'+m,'_fans_'+u,'width=360,height=640,resizable=no');
}


function openChat(u, t) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);

	window.open('chat.html#'+t+'#'+u, '_message_history_' + u, 'width=360,height=720,resizable=no');	
}

function playVideo(u) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);

	window.open('player.html#'+u, '_player_'+u, 'width=368,height=640,resizable=yes');
}

function renderUserLookup(e) {

	$('#videolist').html('');

	if (e === undefined) {
		$('#videolist').html('<div class="emptylist">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid == 0) {
		$('#videolist').html('<div class="emptylist">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid > 0) {
		var u = e.userinfo;
		userID = u.userid;
		$('#userinfo').html(`
				<img src="${u.usericon}" class="avatar" onError="this.src='images/blank.png"><br>
				<h3 class="name">${u.username}</h3>
				<label><input type="text" id="uid" value="${u.userid}" disabled="disabled">
				<h4>Level: ${u.level}</h4>
				<input type="button" value="Following ${u.following}" onClick="showFollowing('${u.userid}', ${u.following}, '${u.username}')">
				<input type="button" value="${u.fans} Fans" onCLick="showFans('${u.userid}', ${u.fans}, '${u.username}')">
				<input type="hidden" id="sex" value="${u.sex}">
		`);
	}

	if (e.videos === undefined) {
		$('#videolist').html('<div class="emptylist">No videos for this user account found.</div>');
		return;
	}

	if (e.videos.length == 0) {
		$('#videolist').html('<div class="emptylist">No videos for this user account found.</div>');
		return;
	}

	for(i = 0; i < e.videos.length; i++) {
		if (e.videos[i].url.length > 8) {

			var dt = new Date(e.videos[i].dt * 1000);
			var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
			var hi1 = $('#type').val() == 'url-lookup' ? ($('#query').val() == e.videos[i].url ? true : false) : false;
			var hi2 = $('#type').val() == 'video-lookup' ? ($('#query').val() == e.videos[i].videoid ? true : false) : false;

			var ls = (e.videos[i].length - Math.round(e.videos[i].length / 60)) % 60, lm = Math.round(e.videos[i].length / 60);
			var length = lm + ':' + (ls < 10 ? '0' : '') + ls, highlight = hi1 || hi2 ? 'highlight' : '', deleted = e.videos[i].private ? '[DELETED]':'';

			$('#videolist').append(`
				<div class="video_entry "${highlight}">
					<a class="url" href="${e.videos[i].url}">${e.videos[i].url}</a>
					<h4 class="date">${ds}</h4>
					<h4 class="title">${deleted}${e.videos[i].title}</h4>
					<img class="chat" src="images/ic_chat_white_24px.svg" onClick="openChat('${e.videos[i].msgfile}', '${e.videos[i].dt}')" title="View Message History">
					<img class="watch" src="images/ic_play_circle_outline_white_24px.svg" onClick="playVideo('${e.videos[i].url}')" title="Play Video">
					<div class="counts">
						<label>Length:</label><span>${length}</span>
						<label>Views:</label><span>${e.videos[i].plays}</span>
						<label>Likes:</label><span>${e.videos[i].likes}</span>
						<label>Shares:</label><span>${e.videos[i].shares}</span>
						<label>Country:</label><span>${e.videos[i].location.country}</span>
					</div>
				</div>
			`);
		}
	}

}

function renderSearchResults(e) {
	$('#main').html('<div id="userlist"></div>');

	if (e.length < 1) {
		$('#main').html('<div class="emptylist">No users were found on LiveMe.</div>');
		return;
	}

	for(i = 0; i < e.length; i++) {
		if (e[i].userid > 0) {
			$('#userlist').append(`
				<div class="user_entry ${e[i].sex}">
					<img class="avatar" src="${e[i].thumb}">
					<h4>${e[i].nickname}</h4>
					<div class="userid">
					<div class="level">Level: <span>${e[i].level}</span></div>
					<input type="button" class="fans" value="${e[i].fans} Fans" onClick="showFans('${e[i].userid}', ${e[i].fans}, '${e[i].nickname}')">';
					<input type="button" class="followings" value="Following ${e[i].followings}" onClick="showFollowing('${e[i].userid}', ${e[i].followings}, '${e[i].nickname}')">';
					<input type="button" class="user" value="${e[i].userid}" onClick="showUser('${e[i].userid}')">';
				</div>
			`);
		}
	}
}



