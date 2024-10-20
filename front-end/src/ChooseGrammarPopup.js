import React from "react";
import { useState } from "react";
import Cookies from "js-cookie";

const JWT_COOKIE_NAME = "X-JWT-TOKEN";

const DEFAULT_PAGE_SIZE = 3;
const FIRST_PAGE_NUMBER = 1;

function nonTerminalsToString(nonTerminals, startSymbol) {
    const startSymbolIndex = nonTerminals.indexOf(startSymbol);

    if (nonTerminals.length === 0) {
        return "";
    }

    if (nonTerminals.length === 1) {
        return String(startSymbol);
    }

    return startSymbol + nonTerminals
        .filter((item, index) => index !== startSymbolIndex)
        .reduce((accumulator, current) => accumulator + ', ' + current, "")
}

function terminalsToString(terminals) {
    const terminalsReduced = terminals
        .map(item => String(item))
        .reduce((accumulator, current) => accumulator + ', ' + current, '');
    if (terminalsReduced.length > 1) {
        return terminalsReduced.slice(1);
    }
    return '';
}

function definingEquationsToString(definingEquations) {
    return definingEquations
        .map(item => String(item))
        .reduce((accumulator, current) => accumulator + '\n\t' + current, "")
        .slice(1)
}

function GrammarOption({ option, onGrammarChoosed }) {

    let id = option.id;
    let startSymbol = option.content.startSymbol;
    let nonTerminals = nonTerminalsToString(option.content.nonTerminals, startSymbol);
    let terminals = terminalsToString(option.content.terminals);
    let definingEquations = definingEquationsToString(option.content.definingEquations);

    return (
        <div className="relative text-center mb-10 bg-white block order-0 p-3 mt-3">
            <div className="border border-_smoke">

                <p>
                    {`#` + id}
                </p>
            </div>
            <div className="border border-_smoke">
                <p >
                    {"Терминалы:"}
                </p>
                <p>
                    {
                        `{ ${terminals} }`
                    }
                </p>
            </div>

            <div className="border border-_smoke">

                <p style={{ whiteSpace: "pre-wrap" }}>
                    {"Нетерминалы \n (первый в списке - стартовый) :"}
                </p>
                <p>
                    {
                        `{ ${nonTerminals} }`
                    }
                </p>
            </div>

            <div className="border border-_smoke">

                <p>
                    {"Определяющие уравнения"}
                </p>
                <p style={{ whiteSpace: "pre-wrap", textAlign: "left" }}>
                    {
                        `{\n${definingEquations}\n}`
                    }
                </p>
            </div>
            <div className="border border-_smoke">

                <p className=" p-2 hover:bg-_dark-blue hover:text-white hover:border-_smoke">
                    <button type="button" onClick={() => onGrammarChoosed({
                        nonTerminals: nonTerminals,
                        terminals: terminals,
                        definingEquations: definingEquations
                    })} >
                        Выбрать
                    </button>
                </p>
            </div>
        </div>
    );
}

function GrammarOptions({ grammarOptions, onGrammarChoosed }) {

    const options = grammarOptions.map((item) => (<GrammarOption key={item.id} option={item} onGrammarChoosed={onGrammarChoosed} />))

    return options;
}

function getPopupContentBasedOnResponse(response, currentPageNumber, onGrammarChoosed) {

    if (response !== null && response.status !== 200) {
        return (<div className="font-bold" id="show-cfgs-empty-page">ОШИБКА</div>);
    }

    if (response === null || response?.pageNumber !== currentPageNumber) {
        return (<div className="font-bold" id="show-cfgs-empty-page">ЗАГРУЗКА...</div>);
    }

    if (response.content.length === 0) {
        return (<div className=" font-bold" id="show-cfgs-empty-page">ПУСТАЯ СТРАНИЦА</div>);
    }

    return (
        <GrammarOptions grammarOptions={response.content} onGrammarChoosed={onGrammarChoosed} />
    );
}


export default function ChooseGrammarPopup({ onGrammarChoosed, activatePopup }) {

    let [currentPageNumber, setCurrentPageNumber] = useState(FIRST_PAGE_NUMBER);

    let [response, setResponse] = useState(null);

    let [grammarReq, setGrammarReq] = useState(null);

    let [isFetching, setIsFetching] = useState(false);

    if (response === null && !isFetching) {
        setIsFetching(true);

        fetchGrammarsAndPublishResponse(setResponse, grammarReq, setGrammarReq, currentPageNumber, DEFAULT_PAGE_SIZE);
    }

    const popupContent = getPopupContentBasedOnResponse(response, currentPageNumber, onGrammarChoosed);


    return (
        <div className="z-10 fixed md:right-1/3 md:left-1/3 bottom-10 h-4/5 overflow-scroll bg-_grayer-white border border-_dark-blue">
            <div className=" flex flex-col items-center justify-between min-h-full relative" id="show-cfgs">
                <p className="self-start flex items-center justify-center m-2 z-10 fixed size-10 hover:bg-_dark-blue hover:text-white hover:border-_smoke">
                    <button className="flex items-center justify-center" id="show-cfgs-close-button" onClick={
                        () => {
                            activatePopup(false);
                            setResponse(null);
                        }
                    } type="button">
                        <span className="material-symbols-outlined h-full w-full ">
                            close
                        </span>
                    </button>
                </p>
                <p className="text-center font-bold text-xl m-3 mt-5 w-4/5" id="to-add-cfgs-after">Выберите грамматику из предложенных</p>

                {popupContent}

                <div className="flex-row justify-center flex flex-nowrap mb-2">

                    <div className=" hover:bg-_dark-blue hover:text-white hover:border-_smoke border size-10 border-gray-400 flex justify-center items-center">
                        <button type="button" className="w-full h-full flex justify-center items-center" id="prev-page-button"
                            onClick={() => {
                                if (currentPageNumber === 1) {
                                    return;
                                }

                                const previousPageNumber = currentPageNumber - 1;

                                fetchGrammarsAndPublishResponse(setResponse, grammarReq, setGrammarReq, previousPageNumber, DEFAULT_PAGE_SIZE);

                                setCurrentPageNumber(previousPageNumber);
                            }}>
                            <span   >
                                &laquo;
                            </span>
                        </button>
                    </div>

                    <div className=" hover:bg-_dark-blue hover:text-white hover:border-_smoke border size-10 border-gray-400 flex justify-center items-center">
                        <span id="cur-page-number">
                            {currentPageNumber}
                        </span>
                    </div>

                    <div className=" hover:bg-_dark-blue hover:text-white hover:border-_smoke border size-10 border-gray-400 flex justify-center items-center">
                        <button type="button" className="w-full h-full" id="next-page-button" onClick={() => {

                            const nextPageNumber = currentPageNumber + 1;

                            fetchGrammarsAndPublishResponse(setResponse, grammarReq, setGrammarReq, nextPageNumber, DEFAULT_PAGE_SIZE);

                            setCurrentPageNumber(nextPageNumber);
                        }}>
                            <span>
                                &raquo;
                            </span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

function fetchGrammarsAndPublishResponse(onResponseReceived, grammarReq, setGrammarReq, currentPageNumber, defaultPageSize) {
    console.log(grammarReq);
    let xhr = new XMLHttpRequest();

    xhr.open('GET', `http://localhost:8080/examples?page-number=${currentPageNumber}&page-size=${defaultPageSize}`);
    xhr.responseType = 'json';
    xhr.withCredentials = true;
    xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get(JWT_COOKIE_NAME));

    xhr.onload = function () {
        if (xhr.status !== 200) {

            const response = {
                status: xhr.status
            }

            onResponseReceived(response);
            setGrammarReq(null);
            return;
        }

        const response = {
            ...xhr.response,
            status: xhr.status
        };

        onResponseReceived(response);
        setGrammarReq(null);
    };

    xhr.onerror = function () {
        alert(`Error when trying to get grammars`);
    }


    if (grammarReq !== null) {
        grammarReq.abort();
        console.log("aborted");
        xhr.send();
        setGrammarReq(xhr);
        return;
    }

    xhr.send();
    setGrammarReq(xhr);
}   
    