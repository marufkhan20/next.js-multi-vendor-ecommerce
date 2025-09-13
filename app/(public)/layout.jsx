"use client";
import Banner from "@/components/Banner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function PublicLayout({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProducts({}));
  }, []);
  return (
    <>
      <Banner />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
