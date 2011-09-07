var show_label="Advance Search &darr;";
var hide_label="Hide options &uarr;";
var searchForms=[];
var firstCall=true;
var annotations={};
var items_per_page=5;
var chips=[];
var ids=[];

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
		ids[i]=jQuery.trim(ids[i]).toUpperCase();
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
 *  This function print the annotations for the protein id 
 */
var response = function(res){
	var text = '';
	var gotAnnotations=false;
	try {
		
		annotations[res.GFF.SEGMENT[0].id] = res.GFF.SEGMENT[0].FEATURE;// getting all the annotations
		text = '<br/>Proteins related with the protein '+res.GFF.SEGMENT[0].id+':<br/>';
		
		text += getDisplayPage(res.GFF.SEGMENT[0].id);
		
		text += '<div id="Pagination_'+res.GFF.SEGMENT[0].id+'"></div> <br style="clear:both;" /> <div id="Searchresult_'+res.GFF.SEGMENT[0].id+'">This content will be replaced when pagination inits.</div>';
		gotAnnotations=true;
	}catch(err){
		text='<br/>The protein with id XXX doesn\'t have any probes linked in the knowledge base<br/>';
	}
	if (firstCall){
		firstCall=false;
		$('#results').html('<div id="sort_type" class="sort_link">(Group for Chips)</div>'+text);
		$('#sort_type').click(function(){
			$('#results').html('<img src="images/loading.gif" />');
			groupByChips();
		});
	}else
		$('#results').append(text);
	if (gotAnnotations){
		initPagination(res.GFF.SEGMENT[0].id);
	}
};
function initPagination(divId) {
    // count entries inside the hidden content
    var num_entries = jQuery('#'+divId+' div.result').length;
    // Create content inside pagination element
    $("#Pagination_"+divId).pagination(num_entries, {
        callback: pageselectCallback,
        items_per_page:items_per_page,
        load_first_page:true
    });
 }
function pageselectCallback(page_index, jq){
	var sep=jq.selector.indexOf("_");
	if (sep!=-1){
		var id=jq.selector.substr(sep+1);
	    var num_entries = jQuery('#'+id+' div.result').length;
	    $('#Searchresult_'+id).empty();
		var max_elem = Math.min((page_index+1) * items_per_page, num_entries);
		for(var i=page_index*items_per_page;i<max_elem;i++){
		    var new_content = jQuery('#'+id+' div.result:eq('+i+')').clone();
		    $('#Searchresult_'+id).append(new_content);
		}
		return false;
	}
    return false;
}

var getDisplayPage= function(key){
	var text = '<div id="'+key+'" style="display:none;">';
	for (var i = 0; i < annotations[key].length; i++) {
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
	ids=jQuery.parseIds(str);
	for (var i=0;i<ids.length;i++){
		client.features({segment: ids[i]}, response, error_response);
	}
	
};
var groupByChips = function(){
	var protein={};
	for (protein in annotations){
		for (var j = 0; j < annotations[protein].length; j++) {
			var ann = annotations[protein][j];
			if (chips[ann.TYPE.textContent] == undefined){
				chips[ann.TYPE.textContent]={};
			}
			if (chips[ann.TYPE.textContent][protein] == undefined)
				chips[ann.TYPE.textContent][protein]=[];
			chips[ann.TYPE.textContent][protein].push(ann);
		}
	}
	responseChips();
};
var groupByProtein = function(){
	var text = '';
	for (var i in ids){
		if (annotations[ids[i]]!=undefined) {
			text += '<br/>Proteins related with the protein '+ids[i]+':<br/>';
			
			text += getDisplayPage(ids[i]);
			
			text += '<div id="Pagination_'+ids[i]+'"></div> <br style="clear:both;" /> <div id="Searchresult_'+ids[i]+'">This content will be replaced when pagination inits.</div>';
			gotAnnotations=true;
		}else{
			text+='<br/>The protein with id '+ids[i]+' doesn\'t have any probes linked in the knowledge base<br/>';
		}
	}
	$('#results').html('<div id="sort_type" class="sort_link">(Group for Chips)</div>'+text);
	$('#sort_type').click(function(){
		$('#results').html('<img src="images/loading.gif" />');
		groupByChips();
	});
	for (var i in ids)
		if (annotations[ids[i]]!=undefined) 
			initPagination(ids[i]);
};

var responseChips = function(){
	var text = '';
	text = '<br/>Chips:<br/>';
	text += getDisplayChipPage(chips);
	text += '<div id="Pagination_group"></div> <br style="clear:both;" /> <div id="Searchresult_group">This content will be replaced when pagination inits.</div>';

	$('#results').html('<div id="sort_type" class="sort_link">(Group for Protein)</div>'+text);
	$('#sort_type').click(function(){
		$('#results').html('<img src="images/loading.gif" />');
		groupByProtein();
	});
	initPagination('group');
};
var getDisplayChipPage= function(chipGroup){
	var text = '<div id="group" style="display:none;">';
	for (chip in chipGroup){
		var firstTime=true;
		var anns = chipGroup[chip];
		for (ann in anns){
			if (firstTime){
				text +='<div class="result">';
				text +='<b>'+anns[ann][0].TYPE.textContent+'</b><br/>';
				text +='<div class="result_item"> &#149; Type: XXXXX</div>';
				text +='<div class="result_item"> &#149; Organism: '+anns[ann][0].TYPE.category+'</div>';
				firstTime=false;
			}
			var probesByProt={};
			for(var j=0;j<anns[ann].length;j++){
				if (probesByProt[ann]==undefined)
					probesByProt[ann]="";
				probesByProt[ann] += ' <a href="'+anns[ann][j].LINK[0].href+'" target="_blank">'+anns[ann][j].label+'</a>,';
			}
				
			for(prot in probesByProt)
				text +='<div class="result_item"> &#149; '+prot+': '+probesByProt[prot].substr(1,probesByProt[prot].length-2)+'</div>';
		}
		text +='</div>';
	}
	text +='</div>';
	return text;
};
