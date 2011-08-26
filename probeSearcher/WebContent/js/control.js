var show_label="Advance Search &darr;";
var hide_label="Hide options &uarr;";
var searchForms=[];
var firstCall=true;
var annotations=[];
(function( $ ){
	$.fn.hider = function() {
		return this.each(function(){
			var id=$(this).attr('id');
			$(this).addClass("hide_show");
			$('#'+id+"_link").html(show_label);
			$('#'+id+"_link").addClass("hide_show_link");
			$('#'+id+"_target").addClass("hide_show_target");
			$('#'+id+'_link').click(function(){
				if ($('#'+id+"_target").css('display')=="block"){
					$('#'+id+"_target").css('display','none');
					$('#'+id+"_link").html(show_label);
				}else{
					$('#'+id+"_target").css('display','block');
					$('#'+id+"_link").html(hide_label);
				}
			});
		});
	};
})( jQuery );

(function( $ ){
	$.fn.topForm = function() {
		return this.each(function(){
			var id=$(this).attr('id');
			searchForms.push(id);
			$(this).children('header').click(function(){
				for (var i=0;i<searchForms.length;i++){
					$('#'+searchForms[i]).children('form').hide();
				}
				$('#'+id).children('form').show();
			});
		});
	};
})( jQuery );


jQuery.parseIds = function(str){
	var ids=str.split(",");
	for (var i=0;i<ids.length;i++){
		ids[i]=jQuery.trim(ids[i]);
	}
	return ids;
};


var server_url = 'http://www.ebi.ac.uk/enfin-srv/das-srv/das/uniprot2probes';
var client = JSDAS.Simple.getClient(server_url);

/**
 * This function will be executed in case of error
 */
var error_response = function(){
        alert('Bad response, Wrong URL?, No XML Response?');
};

/**
 *  This function print the annotations for the protein id P00280
 */
var response = function(res){
	var text = '';
	try {
		annotations[res.GFF.SEGMENT[0].id] = res.GFF.SEGMENT[0].FEATURE;// getting all the annotations
		text = '<br/>Proteins related with the protein '+res.GFF.SEGMENT[0].id+':<br/>';
		
		text += getDisplayPage(res.GFF.SEGMENT[0].id,0,10);
	}catch(err){
		text='<br/>The protein with id XXX doesn\'t have any probes linked in the knowledge base<br/>';
	}
	if (firstCall){
		firstCall=false;
		$('#results').html(text);
	}else
		$('#results').append(text);
};

var getDisplayPage= function(key,from,amount){
	var text = '<div id="'+key+'">';
	if (annotations[key].length>amount){
		text += 'Displaying '+amount+' results of '+annotations[key].length+"<br/>";
		text += '<a>PREV</a>|<a>NEXT</a>';
	}
	for (var i = from; i < annotations[key].length && i<from+amount; i++) {
		text +='<div class="result">';
		var ann = annotations[key][i];
		text +='<a href="'+ann.LINK[0].href+'" target="_blank">'+ann.label+'</a><br/>';
		text +='<div class="result_item"> &#149; Chip: '+ann.TYPE.textContent+'</div>';
		text +='<div class="result_item"> &#149; Type: XXXXX</div>';
		text +='<div class="result_item"> &#149; Organism: '+ann.TYPE.category+'</div>';
		text +='<div class="result_item"> &#149; Sequence: XXXXX</div>';
		text +='</div>';
	}
	text +='</div>';
	return text;
};

var getProbes = function(str){
	var ids=jQuery.parseIds(str);
	for (var i=0;i<ids.length;i++){
		client.features({segment: ids[i]}, response, error_response);
	}
	
};
