var server_url = 'http://oware.cbio.uct.ac.za/das-srv/das/';

var show_label="Advance Search &darr;";
var hide_label="Hide options &uarr;";
var searchForms=[];
var firstCall=true;
var annotations={};
var items_per_page=5;
var chips=[];
var ids=[];
var species=["Homo sapiens", "Mus musculus", "Rattus norvegicus", "Danio rerio", "Drosophila melanogaster", "Caenorhabditis elegans", "Pan troglodytes", "Saccharomyces cerevisiae", "Bos taurus", "Gallus gallus"];
var platforms={affy:"Affymetrix",illumina:"Illumina",agilent:"Agilent",eppendorf:"Eppendorf",phalanx:"Phalanx"};
var currentQuery="";
var currentType="u2p";
var ALL=9999999;

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


jQuery.parseIds = function(str,case_type){
	var ids=str.split(",");
	for (var i=0;i<ids.length;i++){
		switch (case_type){
			case "UPPER":
				ids[i]=jQuery.trim(ids[i]).toUpperCase();
				break;
			case "LOWER":
				ids[i]=jQuery.trim(ids[i]).toLowerCase();
				break;
			default:
				ids[i]=jQuery.trim(ids[i]);
		}
	}
	return ids;
};


var server_url_u2p = server_url+'uniprot2probes';
var client_u2p = JSDAS.Simple.getClient(server_url_u2p);
var server_url_p2u = server_url+'probes2uniprot';
var client_p2u = JSDAS.Simple.getClient(server_url_p2u);
var server_url_e2p = server_url+'ensembl2probes';
var client_e2p = JSDAS.Simple.getClient(server_url_e2p);
var server_url_p2e = server_url+'probes2ensembl';
var client_p2e = JSDAS.Simple.getClient(server_url_p2e);

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
	if (firstCall) annotations={};
	var text = '';
	var gotAnnotations=false;
	var subtitle="Probe sets related with the protein ";
	if (currentType=="p2u")
		subtitle="Proteins related with the probe set ";
	else if (currentType=="e2u")
		subtitle="Probe sets related with the gene ";
	try {
		for (var i=0;i<res.GFF.SEGMENT.length;i++){
			annotations[res.GFF.SEGMENT[i].id] = res.GFF.SEGMENT[i].FEATURE;// getting all the annotations
			text = '<br/><br/>'+subtitle+res.GFF.SEGMENT[i].id+':<br/>';
			
			text += getDisplayPage(res.GFF.SEGMENT[i].id);
			
			text += '<div id="Pagination_'+res.GFF.SEGMENT[i].id+'"></div> <br style="clear:both;" /> <div id="Searchresult_'+res.GFF.SEGMENT[i].id+'">This content will be replaced when pagination inits.</div>';
			gotAnnotations=true;
		}
	}catch(err){
		text='<br/><br/> The query ('+currentQuery+') did not find any results<br/>';
	}
	if (firstCall){
		firstCall=false;
		$('#results').html('<div id="sort_type" class="sort_link">(Group by Chips)</div><div id="list_size" class="size_selector" />'+text);
		$('#sort_type').click(function(){
			$('#results').html('<progress>working...</progress>');
			groupByChips();
		});
	}else
		$('#results').append(text);
	if (gotAnnotations){
		for (var i=0;i<res.GFF.SEGMENT.length;i++)
			initPagination(res.GFF.SEGMENT[i].id);
		$('#list_size').listSizeSelector();
	}
	$("#dialog").dialog('close');
    var new_position = $('#results').offset();
    window.scrollTo(new_position.left,new_position.top-40);
};
function initPagination(divId) {
    // count entries inside the hidden content
    var num_entries = jQuery('#'+divId.replace(".", "\\.")+' div.result').length;
    if (items_per_page=="All")
    	items_per_page=ALL;
    // Create content inside pagination element
    $("#Pagination_"+divId.replace(".", "\\.")).pagination(num_entries, {
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
		var probe= 	key.split(".")[0];

		if (currentType=="p2e")
			text +='<a href="http://www.ensembl.org/'+ann.TYPE.category.replace(" ", "_")+'/Gene/Summary?g='+ann.label+'" target="_blank">'+ann.label+'</a><br/>';
//			text +='<a href="http://www.ensembl.org/'+ann.TYPE.category.replace(" ", "_")+'/Location/Genome?fdb=funcgen;ftype=ProbeFeature;g='+ann.label+';id='+probe+';ptype=pset" target="_blank">'+ann.label+'</a><br/>';
		else if(currentType=="p2u")
			text +='<a href="http://www.uniprot.org/uniprot/'+ann.label+'" target="_blank">'+ann.label+'</a><br/>';
//			text +='<a href="http://www.ensembl.org/'+ann.TYPE.category.replace(" ", "_")+'/Location/Genome?fdb=funcgen;ftype=ProbeFeature;id='+probe+';ptype=pset;p='+ann.label+';" target="_blank">'+ann.label+'</a><br/>';
		else if(currentType=="u2p")
			text +='<a href="'+ann.LINK[0].href+'p='+key+'" target="_blank">'+ann.label+'</a><br/>';
		else
			text +='<a href="'+ann.LINK[0].href+'g='+key+'" target="_blank">'+ann.label+'</a><br/>';
		text +='<div class="result_item"> &#149; Chip: '+ann.TYPE.textContent+'</div>';
//		text +='<div class="result_item"> &#149; Type: XXXXX</div>';
		text +='<div class="result_item"> &#149; Organism: '+ann.TYPE.category+'</div>';
//		text +='<div class="result_item"> &#149; Sequence: XXXXX</div>';
		text +='</div>';
	}
	text +='</div>';
	return text;
};

var getProbes = function(str, type){
	$("#dialog").dialog({ modal: true, closeText: 'cancel', draggable: false });
	currentQuery=str;
	if(type=="IGNORE")
		type="";
	else
		currentType=type;
	switch(currentType){
		case "u2p":
			ids=jQuery.parseIds(str,"UPPER");
			if ($('#platform_'+type).val()=="Any" && $('#organism_'+type).val()=="Any"){
				for (var i=0;i<ids.length;i++){
					client_u2p.features({segment: ids[i]}, response, error_response);
				}
				return;
			}
			var query="",sep="";
			for (var i=0;i<ids.length;i++){
				query += sep+"segmentId:"+ids[i];
				sep = " OR ";
			}
			if ($('#platform_'+type).val()!="Any"){
				if (query!="") query = "("+query+") AND ";
				query += "typeId:"+$('#platform_'+type).val()+"*";
			}
			if ($('#organism_'+type).val()!="Any"){
				if (query!="") query = "("+query+") AND ";
				query += "typeCategory:\""+$('#organism_'+type).val()+"\"";
			}
		 	var params = {query: query};
			client_u2p.features(params, response, error_response);
			break;
		case "p2u":
			ids=jQuery.parseIds(str);
			if ($('#organism_'+type).val()=="Any"){
				for (var i=0;i<ids.length;i++){
					client_p2u.features({segment: ids[i]}, response, error_response);
				}
				return;
			}
			var query="",sep="";
			for (var i=0;i<ids.length;i++){
				query += sep+"segmentId:"+ids[i];
				sep = " OR ";
			}
			if ($('#organism_'+type).val()!="Any"){
				if (query!="") query = "("+query+") AND ";
				query += "typeCategory:\""+$('#organism_'+type).val()+"\"";
			}
		 	var params = {query: query};
			client_p2u.features(params, response, error_response);
			break;
		case "e2p":
			ids=jQuery.parseIds(str,"UPPER");
			if ($('#platform_'+type).val()=="Any" && $('#organism_'+type).val()=="Any"){
				for (var i=0;i<ids.length;i++){
					client_e2p.features({segment: ids[i]}, response, error_response);
				}
				return;
			}
			var query="",sep="";
			for (var i=0;i<ids.length;i++){
				query += sep+"segmentId:"+ids[i];
				sep = " OR ";
			}
			if ($('#platform_'+type).val()!="Any"){
				if (query!="") query = "("+query+") AND ";
				query += "typeId:"+$('#platform_'+type).val()+"*";
			}
			if ($('#organism_'+type).val()!="Any"){
				if (query!="") query = "("+query+") AND ";
				query += "typeCategory:\""+$('#organism_'+type).val()+"\"";
			}
		 	var params = {query: query};
			client_e2p.features(params, response, error_response);
			break;
		case "p2e":
			ids=jQuery.parseIds(str);
			if ($('#organism_'+type).val()=="Any"){
				for (var i=0;i<ids.length;i++){
					client_p2e.features({segment: ids[i]}, response, error_response);
				}
				return;
			}
			var query="",sep="";
			for (var i=0;i<ids.length;i++){
				query += sep+"segmentId:"+ids[i];
				sep = " OR ";
			}
			if ($('#organism_'+type).val()!="Any"){
				if (query!="") query = "("+query+") AND ";
				query += "typeCategory:\""+$('#organism_'+type).val()+"\"";
			}
		 	var params = {query: query};
			client_p2e.features(params, response, error_response);
			break;
	}
};
var groupByChips = function(){
	chips=[];
	for (var protein in annotations){
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
	for (var ann in annotations){
//	for (var i in ids){
		if (annotations[ann]!=undefined) {
			if (currentType=="u2p")
				text += '<br/><br/>Probes related with the protein '+ann+':<br/>';
			else if (currentType=="p2u")
				text += '<br/><br/>Proteins related with the probe '+ann+':<br/>';
			else if (currentType=="e2p")
				text += '<br/><br/>Probes related with the gene '+ann+':<br/>';
			else if (currentType=="p2e")
				text += '<br/><br/>Genes related with the probe '+ann+':<br/>';
 
			
			text += getDisplayPage(ann);
			
			text += '<div id="Pagination_'+ann+'"></div> <br style="clear:both;" /> <div id="Searchresult_'+ann+'">This content will be replaced when pagination inits.</div>';
			gotAnnotations=true;
		}
	}
	for (var id in ids){
		var found=false;
		for (var ann in annotations)
			if (ann.indexOf(ids[id])==0)
				found=true;
		if (!found )text+='<br/>The protein with id '+ids[id]+' doesn\'t have any probes linked in the knowledge base<br/>';
	}
	$('#results').html('<div id="sort_type" class="sort_link">(Group by Chips)</div><div id="list_size" class="size_selector" />'+text);
	$('#sort_type').click(function(){
		$('#results').html('<progress>working...</progress>');
		groupByChips();
	});
	$('#list_size').listSizeSelector();

	for (var ann in annotations)
		if (annotations[ann]!=undefined) 
			initPagination(ann);
};
var responseChips = function(){
	var text = '';
	text = '<div id="list_size" class="size_selector" /><br/><br/>Chips:<br/>';
	text += getDisplayChipPage(chips);
	text += '<div id="Pagination_group"></div> <br style="clear:both;" /> <div id="Searchresult_group">This content will be replaced when pagination inits.</div>';

	if (currentType=="u2p"){
		$('#results').html('<div id="sort_type" class="sort_link">(Group by Protein)</div>'+text);
		$('#sort_type').click(function(){
			$('#results').html('<progress>working...</progress>');
			groupByProtein();
		});
	}else if (currentType=="p2u"){
		$('#results').html('<div id="sort_type" class="sort_link">(Group by Probes)</div>'+text);
		$('#sort_type').click(function(){
			$('#results').html('<progress>working...</progress>');
			groupByProtein();
		});
	}else if (currentType=="e2p"){
		$('#results').html('<div id="sort_type" class="sort_link">(Group by Genes)</div>'+text);
		$('#sort_type').click(function(){
			$('#results').html('<progress>working...</progress>');
			groupByProtein();
		});
	}else if (currentType=="p2e"){
		$('#results').html('<div id="sort_type" class="sort_link">(Group by Probes)</div>'+text);
		$('#sort_type').click(function(){
			$('#results').html('<progress>working...</progress>');
			groupByProtein();
		});
	}
	$('#list_size').listSizeSelector();
	initPagination('group');
};
var getDisplayChipPage= function(chipGroup){
	var text = '<div id="group" style="display:none;">';
	for (chip in chipGroup){
		var firstTime=true;
		var anns = chipGroup[chip];
		for (var ann in anns){
			if (firstTime){
				text +='<div class="result">';
				text +='<b>'+anns[ann][0].TYPE.textContent+'</b><br/>';
//				text +='<div class="result_item"> &#149; Type: XXXXX</div>';
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

(function( $ ){
	$.fn.fillOrganisms = function() {
		return this.each(function(){
			$(this).empty();
			$(this).append('<option value="Any">Any</option>');
			for (var i=0;i<species.length;i++){
				$(this).append('<option value="'+species[i]+'">'+species[i]+'</option>');
			}

		});
	};
})( jQuery );
(function( $ ){
	$.fn.fillPlatforms = function() {
		return this.each(function(){
			$(this).empty();
			$(this).append('<option value="Any">Any</option>');
			for (var key in platforms){
				$(this).append('<option value="'+key+'">'+platforms[key]+'</option>');
			}

		});
	};
})( jQuery );

(function( $ ){
	$.fn.addExample = function(target) {
		return this.each(function(){
			var self=this;
			$(this).click(function(){
				var textA= $("#"+target);
				if ($.trim(textA.val())!="")
					textA.val(textA.val()+", "+self.innerHTML);
				else
					textA.val(self.innerHTML);
			});
		});
	};
})( jQuery );

(function( $ ){
	$.fn.listSizeSelector = function() {
		return this.each(function(){
			var self=this;
			$(self).html('Show <a class="size">5</a> | <a class="size">10</a> | <a class="size">20</a> | <a class="size">50</a> | <a class="size">All</a> results per list.');
			$("#"+self.id+" .size").each(function(){
				if ($(this).html()==items_per_page || (ALL==items_per_page && $(this).html()=="All"))
					$(this).addClass("selected");
				
				$(this).click(function(){
					var selfA=this;
					items_per_page = $(this).html();
					$('div[id^="Pagination_"]').each(function(){
						$("#"+self.id+" .size").each(function(){
							$(this).removeClass("selected");
						});
						$(selfA).addClass("selected");
						var id=$(this)[0].id;
						var sep=id.indexOf("_");
						id=id.substr(sep+1);
						initPagination(id);
					});
				});
			});
		});
	};
})( jQuery );

var changeType = function(source){
	if (source=="from_id"){
		var select=$('#from_id');
		if(select.val()=='Probes'){
			$('#to_id').html('<option>UniProt</option><option>Ensembl</option><option disabled="disabled">Probes</option>');
			$('#examples').html('Examples: <a class="example">208905_at</a>, <a class="example">A_23_P37856</a>, <a class="example">ILMN_1730416</a>.');
			if ($('#to_id').val()=="UniProt")
				currentType="p2u";
			else
				currentType="p2e";
			$('#platform_').val("Any");
			$('#platform_').hide();
			$('label[for="platform_"]').hide();
		}else{
			$('#to_id').html('<option>Probes</option><option disabled="disabled">Ensembl</option><option disabled="disabled">UniProt</option>');
			if(select.val()=='UniProt'){
				$('#examples').html('Examples: <a class="example">P05067</a>, <a class="example">P99999</a>, <a class="example">P69905</a>');
				currentType="u2p";
			}else if(select.val()=='Ensembl'){
				$('#examples').html('Examples: <a class="example">ENSG00000169246</a>, <a class="example">ENSG00000206172</a>');
				currentType="e2p";
			}
			$('#platform_').show();
			$('label[for="platform_"]').show();
		}
		$('span.description > a.example').addExample('query_ids');
	}else if (source=="to_id"){
		if ($('#to_id').val()=="UniProt")
			currentType="p2u";
		else
			currentType="p2e";
	}
	$('#query_ids').val('');
	
};
