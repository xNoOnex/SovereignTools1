import React, { createContext, useState, useEffect } from 'react';

export const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
    const [events, setEvents] = useState([]);

    // Boot-up: Load offline events from local vault
    useEffect(() => {
        const vaultData = localStorage.getItem('sov_calendar_events');
        if (vaultData) {
            try {
                setEvents(JSON.parse(vaultData));
            } catch (e) {
                console.error("Vault decryption error", e);
            }
        }
    }, []);

    // Add event and trigger native bridge notification
    const addEvent = (event) => {
        const newEvents = [...events, event];
        setEvents(newEvents);
        localStorage.setItem('sov_calendar_events', JSON.stringify(newEvents));

        // Push to Android Native Alarm Manager via your Java Bridge
        if (window.SovereignBridge && window.SovereignBridge.scheduleAlarm) {
            window.SovereignBridge.scheduleAlarm(event.title, event.timestamp);
        } else {
            console.warn("SovereignBridge offline. Event stored in local state.");
        }
    };

    return (
        <CalendarContext.Provider value={{ events, addEvent }}>
            {children}
        </CalendarContext.Provider>
    );
};
