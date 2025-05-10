import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

// Define post type with platform info
interface ScheduledPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  content: string;
  images?: string[];
  time: string;
}

interface PostScheduleProps {
  month?: string;
  year?: string;
  posts: Record<string, ScheduledPost[]>;
  onViewDetail?: (post: ScheduledPost) => void;
}

export default function PostSchedule({ 
  month = "November", 
  year = "2024", 
  posts,
  onViewDetail 
}: PostScheduleProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState("19");
  
  // Calendar days for the week
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = ["15", "16", "17", "18", "19", "20", "21"];
  
  // Function to get post card background color based on platform
  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-600 to-pink-500';
      case 'facebook':
        return 'bg-gradient-to-r from-blue-600 to-blue-500';
      case 'twitter':
        return 'bg-gradient-to-r from-blue-400 to-blue-300';
      default:
        return 'bg-gray-200';
    }
  };
  
  // Get posts for selected date
  const selectedDatePosts = posts[selectedDate] || [];
  
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">{t('dashboard.postSchedule')}</h2>
          <Select defaultValue={`${month} ${year}`}>
            <SelectTrigger className="w-[180px] text-sm border border-neutral-100 rounded-lg">
              <SelectValue placeholder={`${month} ${year}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`${month} ${year}`}>{month} {year}</SelectItem>
              <SelectItem value="December 2024">December 2024</SelectItem>
              <SelectItem value="January 2025">January 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Calendar navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" size="icon" className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </Button>
          
          <div className="grid grid-cols-7 gap-4 text-center">
            {weekDays.map((day, index) => (
              <div key={day} className="flex flex-col items-center">
                <span className="text-sm text-gray-500 mb-2">{day}</span>
                <Button
                  variant="ghost"
                  className={`w-10 h-10 rounded-full ${selectedDate === dates[index] ? 'bg-purple-600 text-white' : ''}`}
                  onClick={() => setSelectedDate(dates[index])}
                >
                  {dates[index]}
                </Button>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" size="icon" className="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Button>
        </div>
        
        {/* Scheduled posts for the selected day */}
        <div className="space-y-6">
          {selectedDatePosts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No posts scheduled for this day
            </div>
          ) : (
            <>
              {/* Morning timeblock */}
              <div>
                <div className="text-sm font-medium mb-2">12:00</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedDatePosts.filter(post => post.time === '12:00').map((post) => (
                    <motion.div 
                      key={post.id}
                      className="border rounded-lg overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            {post.platform === 'instagram' && (
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png" alt="Instagram" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {post.platform === 'facebook' && (
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/800px-2021_Facebook_icon.svg.png" alt="Facebook" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {post.platform === 'twitter' && (
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" alt="Twitter" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="font-medium">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </Button>
                        </div>
                        
                        <p className="text-sm mb-3 line-clamp-2">{post.content}</p>
                        
                        {post.images && post.images.length > 0 && (
                          <div className="flex space-x-1 mb-2">
                            {post.images.map((img, i) => (
                              <div key={i} className="w-16 h-16 rounded overflow-hidden">
                                <img src={img} alt="Post media" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {post.images.length > 3 && (
                              <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                                <span className="text-sm text-gray-500">+{post.images.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Afternoon timeblock */}
              <div>
                <div className="text-sm font-medium mb-2">17:00</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedDatePosts.filter(post => post.time === '17:00').map((post) => (
                    <motion.div 
                      key={post.id}
                      className="border rounded-lg overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            {post.platform === 'instagram' && (
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png" alt="Instagram" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {post.platform === 'facebook' && (
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/800px-2021_Facebook_icon.svg.png" alt="Facebook" className="w-full h-full object-cover" />
                              </div>
                            )}
                            {post.platform === 'twitter' && (
                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" alt="Twitter" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="font-medium">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </Button>
                        </div>
                        
                        <p className="text-sm mb-3 line-clamp-2">{post.content}</p>
                        
                        {post.images && post.images.length > 0 && (
                          <div className="flex space-x-1 mb-2">
                            {post.images.map((img, i) => (
                              <div key={i} className="w-16 h-16 rounded overflow-hidden">
                                <img src={img} alt="Post media" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {post.images.length > 3 && (
                              <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center">
                                <span className="text-sm text-gray-500">+{post.images.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}