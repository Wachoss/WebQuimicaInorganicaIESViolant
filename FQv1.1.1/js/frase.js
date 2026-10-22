function frases(){
frase= Math.round(Math.random()*4);
			  if(frase===1){
			document.getElementById('VoF').innerHTML="¡Correcto! ¡Eres un crack!";
			  }
			  if(frase===2){
			document.getElementById('VoF').innerHTML="¡Bien hecho!";
			  }
			  if(frase===3){
			document.getElementById('VoF').innerHTML="¡Lo tienes controlado!";
			  }
			  if(frase===4){
			 document.getElementById('VoF').innerHTML="¡Sigue así!";
			  }
}