var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
var SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList;
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

window.speechSynthesis.getVoices();
const synthesis = { voices: [], pitch: 1, rate: 0.99, volume: 1 }; // defaults
setTimeout(() => synthesis.voices = window.speechSynthesis.getVoices(), 100);

var phrases = [
	'I love to sing because it\'s fun',
	'where are you going',
	'can I call you tomorrow',
	'why did you talk while I was talking',
	'she enjoys reading books and playing games',
	'where are you going',
	'have a great day',
	'she sells seashells on the seashore'
];

phrases = [
	'add a* new symbol',
	'add a* new association',
	'add above',
	'add below',
	'add under*',
	'remove this*',
	'expand this*',
	'collapse this*',
	'remove all',
	'expand all',
	'collapse all',
];

phrases = [
	'A blessing in disguise',
	'A dime a dozen',
	'Beat around the bush',
	'Better late than never',
	'Cutting corners',
	'Call it a day',
];

let dataset = select_dataset(dataset1, 10);

function select_dataset(datasetx, count=0) {
    datasetx.map(function(row) {
        if(row.length === 3) row.push(''); // add sentance examples
        if(row.length === 4) row.push(0); // number of times practiced
        if(row.length === 5) row.push(0); // confidence/score
        return row;
    })
    if(count) datasetx = datasetx.slice(0, count);
    phrases = datasetx.map(a => a[0]);
    return datasetx;
}
console.log(dataset);
console.log(phrases);

let selected_index = null;
let selected_phrase = null;
let selected_meaning = null;
let prev_selected_index = null;
let prev_selected_phrase = null;

function select_index(index) {
    if(index === undefined) index = prev_selected_index;
    selected_index = index;
    console.log(selected_index);
    $('#exampleModal').modal('hide');
}

let score = { total: 0, correct: 0, incorrect: 0, proper: 0, width: 0, depth: 0, filled: 0, count: dataset.length };
let settings = { prompter: 0 };

var phrasePara = document.querySelector('.phrase');
var resultPara = document.querySelector('.result');
var diagnosticPara = document.querySelector('.output');

var testBtn = document.querySelector('button');
var repeatBtn = document.querySelector('#repeattest');

function randomPhrase() {
	var number = Math.floor(Math.random() * phrases.length);
	return number;
}

async function testSpeech() {
	testBtn.disabled = true;
	testBtn.textContent = 'Test in progress';

	// var phrase = phrases[randomPhrase()];
    let randomIndex = selected_index!==null ? selected_index : randomPhrase();
    let phrase = phrases[randomIndex];
    let data = dataset[randomIndex]
    prev_selected_index = randomIndex;
    prev_selected_phrase = phrase;
    selected_index = null;
    selected_phrase = phrase;
    selected_meaning = data[1];
    console.log(randomIndex);
    if(settings.prompter) await speak_it(phrase);
    if(settings.prompter) console.log('...done speaking');
	// To ensure case consistency while checking with the returned output text
	phrase = phrase.toLowerCase();
	phrasePara.textContent = phrase;
	resultPara.textContent = 'Right or wrong?';
	resultPara.style.background = 'rgba(0,0,0,0.2)';
	diagnosticPara.textContent = '...diagnostic messages';

	var grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + phrases.join(" | ") +' ;';
	// var grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + 'phrase' +';';
	// console.log(grammar);
	// var grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + phrase +';';
	var recognition = new SpeechRecognition();
	var speechRecognitionList = new SpeechGrammarList();
	speechRecognitionList.addFromString(grammar, 1);
	recognition.grammars = speechRecognitionList;
	recognition.lang = 'en-US';
	recognition.interimResults = false;
	recognition.maxAlternatives = 1;

	recognition.start();

    recognition.onresult = function(event) {
        let confidence = event.results[0][0].confidence;
        // let confidence = random(0.5, 0.99);
		// The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
		// The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
		// It has a getter so it can be accessed like an array
		// The first [0] returns the SpeechRecognitionResult at position 0.
		// Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
		// These also have getters so they can be accessed like arrays.
		// The second [0] returns the SpeechRecognitionAlternative at position 0.
		// We then return the transcript property of the SpeechRecognitionAlternative object 
		var speechResult = event.results[0][0].transcript.toLowerCase();
		diagnosticPara.textContent = 'Speech received: ' + speechResult + '.';
		// if(speechResult === phrase) {
		let phrase_pattern = phrase;
        // if(confirm("Press a button!")) phrase_pattern = speechResult;
        // if(random(0,1)>0.5) phrase_pattern = speechResult;
		phrase_pattern = phrase_pattern.replace(/(\w+)\*/g, "($1)*");
        phrase_pattern = phrase_pattern.replace(/[,']/g, ".?");
		phrase_pattern = phrase_pattern.replace(/\s+/g, "\\s*");
		console.log(phrase_pattern);
		if(speechResult.match(phrase_pattern)) {
			resultPara.textContent = 'I heard the correct phrase!';
			resultPara.style.background = 'lime';
            data[5] = data[4]===0 ? confidence : (data[5]/100 + confidence)/2;
            data[5] = Math.round(data[5] * 100); // convert to 0-100 scale
            score.correct++;
		} else {
			resultPara.textContent = 'That didn\'t sound right.';
			resultPara.style.background = 'red';
            data[5] = Math.round(data[5] * 0.7); //(data[5] + confidence)/2;
            score.incorrect++;
		}
        data[4]++; // increment number of times practiced
        score.total = score.correct + score.incorrect;
        score.width = Math.round(dataset.map(row => row[4]/3).reduce((a,b) => a+b,0)/score.count*100);
        score.depth = Math.round(score.total / score.count * 100) / 100;
        score.filled = Math.round(score.total / score.count / 3 * 100);
        score.proper = Math.round(dataset.map(row => row[5]*row[4]).reduce((a,b) => a+b,0)/score.count);
        console.log(data);
        // console.log(score);
        // let datasetnn = dataset.map(row => { row.push('\n'); return row; });
        // // console.log(JSON.stringify(datasetnn));
        let datasetnn = dataset.map(row => row.join('\t'));
        // console.log(datasetnn.join('\n'));
        // console.log(datasetnn);

        // console.log('Confidence: ' + confidence);
		console.log('Confidence: ' + event.results[0][0].confidence);

        update_score(data);
        console.log(JSON.stringify(score));
	}

	recognition.onspeechend = function() {
        console.log('...speech ended');
		recognition.stop();
		testBtn.disabled = false;
		testBtn.textContent = 'Start new test';
	}

	recognition.onerror = function(event) {
		testBtn.disabled = false;
		testBtn.textContent = 'Start new test';
		diagnosticPara.textContent = 'Error occurred in recognition: ' + event.error;
	}
}

testBtn.addEventListener('click', testSpeech);
repeatBtn.addEventListener('click', testSpeech);

// ------------------------------------------

async function speak_it(text=selected_phrase) {
    if(text==='meaning') text = selected_meaning;
    // text = convert(text);
    const ut = new SpeechSynthesisUtterance(text);
    [ut.voice, ut.pitch, ut.rate] = [synthesis.voices[3], synthesis.pitch, synthesis.rate];
    // await window.speechSynthesis.speak(ut);
    await new Promise(function(resolve) {
      ut.onend = resolve;
      window.speechSynthesis.speak(ut);
    });
    // window.speechSynthesis.getVoices().forEach(voice => console.log(voice.name + ' (' + voice.lang + ')'));
    // console.log(`speaking...`, text)
    console.log(synthesis);
    console.log(text)
    return text;
}

function random(min, max) {
  return min + Math.random() * (max - min);
}
