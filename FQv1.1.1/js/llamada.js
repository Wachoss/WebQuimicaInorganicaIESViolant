function llamadaf(text1, text2){
	text= text1+text2;
	switch(text){
	  case "iupachidruros":
	    document.all.iframe1.src="pag/formulacion/sistbinhid.html"; 
	    break;
	  case "iupacoxidos":
	    document.all.iframe1.src="pag/formulacion/sistbinoxi.html";
	    break;
	  case "iupacsales":
	    document.all.iframe1.src="pag/formulacion/sistbinsales.html";
	    break;
	  case "iupacperoxidos":
	    document.all.iframe1.src="pag/formulacion/sistbinpero.html";
	    break;
	  case "iupachidroxidos":
		document.all.iframe1.src="pag/formulacion/sistterhid.html";
	  	break;
	  case "stockhidruros":
	    document.all.iframe1.src="pag/formulacion/stockbinhid.html";
	    break;
	  case "stockoxidos":
	    document.all.iframe1.src="pag/formulacion/stockbinoxi.html";
	    break;
	  case "stocksales":
	    document.all.iframe1.src="pag/formulacion/stockbinsales.html";
	    break;
	  case "stockperoxidos":
	    document.all.iframe1.src="pag/formulacion/stockbinpero.html";
	    break;
	  case "stockhidroxidos":
		document.all.iframe1.src="pag/formulacion/stockterhid.html";
	  	break;
	  case "clasicahidruros":
	    document.all.iframe1.src="pag/formulacion/tradbinhid.html";
	    break;
	  case "clasicaperoxidos":
	    document.all.iframe1.src="pag/formulacion/tradbinpero.html";
	    break;
	  case "clasicaoxoacidos":
	    document.all.iframe1.src="pag/formulacion/tradteroxoacidos.html";
	    break;
	  case "stockoxosales":
	    document.all.iframe1.src="pag/formulacion/stockteroxosales.html";
	    break;
	  case "stocksales acidas":
	    document.all.iframe1.src="pag/formulacion/stocktersalesacidas.html";
	    break;	  
	}
}
function llamadan(text1, text2){
	text= text1+text2;
	switch(text){
		 case "iupachidruros":
	    document.all.iframe1.src="pag/nomenclatura/sistbinhidnom.html";
	    break;
	  case "iupacoxidos":
	    document.all.iframe1.src="pag/nomenclatura/sistbinoxinom.html";
	    break;
	  case "iupacsales":
	    document.all.iframe1.src="pag/nomenclatura/sistbinsalesnom.html";
	    break;
	  case "iupacperoxidos":
	    document.all.iframe1.src="pag/nomenclatura/sistbinperonom.html";
	    break;
	  case "iupachidroxidos":
		document.all.iframe1.src="pag/nomenclatura/sistterhidnom.html";
	  	break;
	  case "stockhidruros":
	    document.all.iframe1.src="pag/nomenclatura/stockbinhidnom.html";
	    break;
	  case "stockoxidos":
	    document.all.iframe1.src="pag/nomenclatura/stockbinoxinom.html";
	    break;
	  case "stocksales":
	    document.all.iframe1.src="pag/nomenclatura/stockbinsalesnom.html";
	    break;
	  case "stockperoxidos":
	    document.all.iframe1.src="pag/nomenclatura/stockbinperonom.html";
	    break;
	  case "stockhidroxidos":
		document.all.iframe1.src="pag/nomenclatura/stockterhidnom.html";
	  	break;
	  case "clasicahidruros":
	    document.all.iframe1.src="pag/nomenclatura/tradbinhidnom.html";
	    break;
	  case "clasicaperoxidos":
	    document.all.iframe1.src="pag/nomenclatura/tradbinperonom.html";
	    break;
	  case "clasicaoxoacidos":
	    document.all.iframe1.src="pag/nomenclatura/tradteroxoacidosnom.html";
	    break;
	  case "stockoxosales":
	    document.all.iframe1.src="pag/nomenclatura/stockteroxosalesnom.html";
	    break;
	  case "stocksales acidas":
	    document.all.iframe1.src="pag/nomenclatura/stocktersalesacidasnom.html";
	    break;	  
	}
}

function instrucciones(){
	document.all.iframe1.src="pag/instrucciones.html";
}

function formularmenu(){
	document.getElementById("menuform").style.display = "block";
	document.getElementById("menunom").style.display = "none";
	document.getElementById("2").disabled=false;
	document.getElementById("7").disabled=false;
	document.getElementById("8").disabled=false;
	document.getElementById("9").disabled=false;
	document.getElementById("12").disabled=false;
	document.getElementById("17").disabled=false;
	document.getElementById("18").disabled=false;
	document.getElementById("19").disabled=false;
	document.getElementById("3").disabled=false;
	document.getElementById("6").disabled=false;
	document.getElementById("13").disabled=false;
	document.getElementById("16").disabled=false;
}
function nomenmenu(){
	document.getElementById("menunom").style.display="block";
	document.getElementById("menuform").style.display="none";
	document.getElementById("2").disabled=false;
	document.getElementById("7").disabled=false;
	document.getElementById("8").disabled=false;
	document.getElementById("9").disabled=false;
	document.getElementById("12").disabled=false;
	document.getElementById("17").disabled=false;
	document.getElementById("18").disabled=false;
	document.getElementById("19").disabled=false;
	document.getElementById("3").disabled=false;
	document.getElementById("6").disabled=false;
	document.getElementById("13").disabled=false;
	document.getElementById("16").disabled=false;
}