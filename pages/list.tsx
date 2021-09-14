import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../data/store'
import { load } from '../data/armySlice'
import { ArmyList } from "../views/ArmyList";
import { MainList } from "../views/MainList";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function List() {

    const list = useSelector((state: RootState) => state.list);
    const army = useSelector((state: RootState) => state.army);

    const [slider, setSlider] = useState();

    const dispatch = useDispatch();

    useEffect(() => {
        // TODO: Test only, add army selection
        fetch(army.armyFile)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                dispatch(load(data));
            });
    }, []);

    const settings = {
        dots: true,
        slidesToShow: 3,
        infinite: false,
        arrows: false,
        initialSlide: 1,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 2
                }
            },
            {
                breakpoint: 960,
                settings: {
                    slidesToShow: 1
                }
            }
        ]
    };

    return (
        <>
            <Head>
                <title>OPR Army Forge</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Slider {...settings} ref={slider => setSlider(slider)} style={{ maxHeight: "100%" }}>
                <div>
                    <ArmyList onSelected={() => slider.slickGoTo(1)} />
                </div>
                <div>
                    <MainList />
                </div>
                <div>
                    <h1 className="is-size-1">Upgrades</h1>
                </div>
            </Slider>
            {/* <div className="columns" style={{ minHeight: "100vh" }}>
        {army && (
          <div className="column is-one-quarter">
            <ArmyList />
          </div>
        )}
        <div className="column">
          <MainList />
        </div>
      </div> */}
        </>
    );
}
