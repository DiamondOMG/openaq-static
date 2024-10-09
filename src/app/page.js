"use client";

import React, { useEffect, useState } from "react";

export default function Home() {
  const [airQualityData, setAirQualityData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลอากาศและเก็บข้อมูลใน localStorage
  const fetchAirQualityData = async (latitude, longitude) => {
    try {
      const res = await fetch(`/api/airquality?lat=${latitude}&long=${longitude}`);
      const data = await res.json();
  
      if (data.results.length > 0) {
        const result = data.results[0];
        const location = result.location;
        const pm25Value = result.measurements[0].value;
        const lastUpdated = result.measurements[0].lastUpdated;
  
        // เก็บค่าใน localStorage
        localStorage.setItem("lat", latitude);
        localStorage.setItem("long", longitude);
        localStorage.setItem("location", location);
        localStorage.setItem("pm25Value", pm25Value);
        localStorage.setItem("lastUpdated", lastUpdated);
  
        // เซ็ตค่า state เพื่อ render
        setAirQualityData({
          coordinates: { latitude, longitude },
          location,
          pm25Value,
          lastUpdated
        });
      } else {
        setError("ไม่พบข้อมูลอากาศสำหรับตำแหน่งนี้");
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      // เช็คว่ามีข้อมูลใน localStorage หรือไม่
      const location = localStorage.getItem("location");
      const pm25Value = localStorage.getItem("pm25Value");
      const lastUpdated = localStorage.getItem("lastUpdated");
      const latitude = localStorage.getItem("lat");
      const longitude = localStorage.getItem("long");

      // ถ้ามีข้อมูลใน localStorage ให้นำมาใช้
      if (location && pm25Value && lastUpdated) {
        setAirQualityData({
          coordinates: { latitude, longitude },
          location,
          pm25Value,
          lastUpdated
        });
        setLoading(false);
      } else {
        try {
          // ถ้าไม่มี ให้ดึงพิกัดจาก Geolocation API
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          const lat = position.coords.latitude;
          const long = position.coords.longitude;

          // ดึงข้อมูลจาก OpenAQ API โดยใช้พิกัดที่ได้จาก Geolocation
          await fetchAirQualityData(lat, long);
        } catch (error) {
          setError("ไม่สามารถดึงตำแหน่งได้");
          setLoading(false);
        }
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>กำลังโหลด...</div>;
  if (error) return <div>{error}</div>;

  // ดึงข้อมูลที่ได้จาก state
  const { latitude, longitude } = airQualityData.coordinates;
  const { location, pm25Value, lastUpdated } = airQualityData;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">ข้อมูลคุณภาพอากาศ</h1>
        <ul className="text-gray-700">
          <li><strong>ละติจูด:</strong> {latitude}</li>
          <li><strong>ลองจิจูด:</strong> {longitude}</li>
          <li><strong>สถานที่:</strong> {location}</li>
          <li><strong>ค่า PM2.5:</strong> {pm25Value} µg/m³</li>
          <li><strong>อัปเดตล่าสุด:</strong> {new Date(lastUpdated).toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
}
