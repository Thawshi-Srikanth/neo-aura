import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AsteroidCombobox } from '../controls/AsteroidCombobox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AsteroidWireframe3D } from '../visualizations/AsteroidWireframe3D';
import { asteroidData } from '../../data/asteroids';
import type { Asteroid } from '../../types/asteroid';
import { useNavigation } from '../../contexts/NavigationContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { startNavigation } = useNavigation();
    const [selectedAsteroidIndex, setSelectedAsteroidIndex] = useState(-1);

    const handleAsteroidSelect = (_asteroid: Asteroid, index: number) => {
        setSelectedAsteroidIndex(index);
    };


    const handleEnterPress = (asteroid: Asteroid) => {
        console.log('🎯 handleEnterPress called with asteroid:', asteroid.name, 'ID:', asteroid.id);
        console.log('🎯 Navigating to:', `/impact-simulation/${asteroid.id}`);
        startNavigation('Loading Impact Simulation');
        navigate(`/impact-simulation/${asteroid.id}`);
    };

    // Get 3 featured asteroids from the database
    const featuredAsteroids = asteroidData.slice(0, 6).map(asteroid => ({
        id: asteroid.id,
        name: asteroid.name,
        diameter: asteroid.estimated_diameter.meters.estimated_diameter_max,
        hazardous: asteroid.is_potentially_hazardous_asteroid,
        approachDate: asteroid.close_approach_data?.[0]?.close_approach_date || "Unknown"
    }));

    return (
        <div className="min-h-screen h-full w-full flex items-center justify-center bg-black text-white overflow-auto">
            {/* Main Dashboard */}
            <div className="min-h-full flex flex-col h-full w-full items-center justify-center">
                 <div className="flex-1 max-w-6xl mx-auto px-3 py-2 w-full min-h-full">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 min-h-full">

                        {/* Left Column - Featured Asteroids with Search */}
                        <div className="lg:col-span-1 min-h-full">
                            <Card className="bg-black min-h-full flex flex-col">
                                <CardHeader className="flex-shrink-0 pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-white text-sm">Featured Asteroids</CardTitle>
                                        <Badge variant="secondary" className="text-xs">Live</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col p-2">
                                    {/* Search Section */}
                                    <div className="mb-3">
                                        <AsteroidCombobox
                                            onAsteroidSelect={handleAsteroidSelect}
                                            selectedAsteroidIndex={selectedAsteroidIndex}
                                            onEnterPress={handleEnterPress}
                                        />
                                    </div>
                                    
                                    {/* Featured Asteroids Grid */}
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="grid grid-cols-2 gap-1">
                                            {featuredAsteroids.slice(0, 4).map((asteroid) => (
                                                <Card
                                                    key={asteroid.id}
                                                    className="bg-black cursor-pointer group aspect-square relative overflow-hidden"
                                                    onClick={() => {
                                                        startNavigation('Loading Impact Simulation');
                                                        navigate(`/impact-simulation/${asteroid.id}`);
                                                    }}
                                                >
                                                   <CardContent className="p-0 h-full flex flex-col relative">
                                                       {/* 3D Wireframe Asteroid Visualization */}
                                                       <div className="flex-1 w-full h-full">
                                                           <AsteroidWireframe3D
                                                               diameter={asteroid.diameter}
                                                               asteroidId={asteroid.id}
                                                               className="w-full h-full"
                                                           />
                                                       </div>

                                                       {/* Name Overlay */}
                                                       <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2">
                                                           <h3 className="text-xs font-semibold text-white truncate text-center">{asteroid.name}</h3>
                                                       </div>

                                                       {/* Hover: Only Simulate Button */}
                                                       <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                           <button
                                                               className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors flex items-center space-x-2 cursor-pointer"
                                                               onClick={(e) => {
                                                                   e.stopPropagation();
                                                                   startNavigation('Loading Impact Simulation');
                                                                   navigate(`/impact-simulation/${asteroid.id}`);
                                                               }}
                                                           >
                                                               <span>Simulate</span>
                                                               <span>→</span>
                                                           </button>
                                                       </div>
                                                   </CardContent>
                                               </Card>
                                           ))}
                                       </div>
                                   </div>
                               </CardContent>
                           </Card>
                       </div>

                        {/* Right Column - AURA Header */}
                        <div className="lg:col-span-2 min-h-full flex flex-col space-y-3">

                            {/* AURA Header */}
                            <Card className="bg-black flex-shrink-0">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-2xl font-bold text-white">AURA</div>
                                            <div className="text-xs text-gray-300">
                                                Asteroid Understanding & Risk Assessment
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            <span className="text-xs text-gray-300">Connected</span>
                                        </div>
                                    </div>
                                    
                                    {/* Implementation Details */}
                                    <div className="space-y-2 text-xs text-gray-300">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                            <span>Real-time NASA NEO data integration</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                            <span>3D orbital mechanics simulation</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                                            <span>Impact prediction algorithms</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {/* Instructions */}
                                        <div className="bg-black/50 rounded p-3 border border-white/10">
                                            <h4 className="text-sm font-semibold text-white mb-2">How to Use:</h4>
                                            <div className="space-y-1 text-xs text-gray-300">
                                                <div className="flex items-start space-x-2">
                                                    <span className="text-blue-400 font-bold">1.</span>
                                                    <span>Search for asteroids using the search bar or click featured asteroids</span>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <span className="text-blue-400 font-bold">2.</span>
                                                    <span>Select an asteroid to automatically launch impact simulation</span>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <span className="text-blue-400 font-bold">3.</span>
                                                    <span>Analyze orbital paths, impact zones, and deflection strategies</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Technical Stack */}
                                        <div className="bg-black/50 rounded p-3 border border-white/10">
                                            <h4 className="text-sm font-semibold text-white mb-2">Tech Stack:</h4>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                                                <div>• React + TypeScript</div>
                                                <div>• Three.js 3D Engine</div>
                                                <div>• NASA NEO API</div>
                                                <div>• Real-time Physics</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Navigation & System Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">

                                 {/* Navigation Card */}
                                 <Card className="bg-black h-full flex flex-col">
                                     <CardHeader className="text-center flex-shrink-0 pb-2">
                                         <CardTitle className="text-white text-sm">Orbital Navigation</CardTitle>
                                         <CardDescription className="text-gray-300 text-xs">
                                             Access 3D orbital visualization
                                         </CardDescription>
                                     </CardHeader>
                                     <CardContent className="flex-1 flex flex-col justify-center p-3">
                                         <div className="space-y-3">
                                             {/* Orbital Animation */}
                                             <div className="flex justify-center">
                                                 <div className="relative w-12 h-12">
                                                     {/* Central Ball */}
                                                     <div className="absolute inset-0 flex items-center justify-center">
                                                         <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                                     </div>
                                                     {/* Orbital Ring */}
                                                     <div className="absolute inset-0 border border-gray-500 rounded-full animate-spin opacity-60" style={{animationDuration: '4s'}}></div>
                                                     {/* Orbital Ring 2 */}
                                                     <div className="absolute inset-1 border border-gray-400 rounded-full animate-spin opacity-40" style={{animationDuration: '6s', animationDirection: 'reverse'}}></div>
                                                 </div>
                                             </div>
                                             
                                             <div className="text-center space-y-2">
                                                 <button
                                                     onClick={() => {
                                                         startNavigation('Loading Orbital Visualization');
                                                         navigate('/orbital-visualization');
                                                     }}
                                                     className="w-full px-4 py-2 bg-white text-black font-medium rounded hover:bg-gray-200 transition-colors text-xs cursor-pointer"
                                                 >
                                                     Launch Orbital View
                                                 </button>
                                                 <p className="text-xs text-gray-400">
                                                     Explore asteroid orbits in 3D space
                                                 </p>
                                             </div>
                                         </div>
                                     </CardContent>
                                 </Card>

                                 {/* Credits Card */}
                                 <Card className="bg-black h-full flex flex-col">
                                     <CardHeader className="flex-shrink-0 pb-2">
                                         <CardTitle className="text-white text-sm">Credits</CardTitle>
                                         <CardDescription className="text-white text-xs">
                                             Development Team
                                         </CardDescription>
                                     </CardHeader>
                                     <CardContent className="flex-1 flex flex-col justify-center p-3">
                                         <div className="space-y-2 text-xs">
                                             <div className="flex justify-between">
                                                 <span className="text-gray-300">Coders:</span>
                                                 <span className="text-blue-400 font-medium">Thawshi, Dilhan</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-gray-300">PM:</span>
                                                 <span className="text-white font-medium">Manuja</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-gray-300">UI/UX:</span>
                                                 <span className="text-white font-medium">Hansani</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-gray-300">Analytics:</span>
                                                 <span className="text-white font-medium">Thulani</span>
                                             </div>
                                             <div className="flex justify-between">
                                                 <span className="text-gray-300">Tech:</span>
                                                 <span className="text-white font-medium">React + Three.js</span>
                                             </div>
                                         </div>
                                     </CardContent>
                                 </Card>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
